import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from 'playwright'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SHOTS = resolve(ROOT, 'shots')

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}

const width = Number(arg('width', '1280'))
const height = Number(arg('height', '720'))
const url = arg('url', 'http://localhost:5173/')

const settle = (page: Page, frames = 30) =>
  page.evaluate(async (count) => {
    for (let i = 0; i < count; i++) await new Promise((r) => requestAnimationFrame(r))
  }, frames)

const STEPS: Record<string, (page: Page, value: string) => Promise<unknown>> = {
  click: (page, value) => {
    const [x = 0, y = 0] = value.split(',').map(Number)
    return page.mouse.click(x, y)
  },
  'click-text': (page, value) => page.getByText(value, { exact: true }).first().click(),
  'click-selector': (page, value) => page.locator(value).first().click(),
  hover: (page, value) => {
    const [x = 0, y = 0] = value.split(',').map(Number)
    return page.mouse.move(x, y, { steps: 4 })
  },
  key: async (page, value) => {
    const [code = 'KeyW', ms = '300'] = value.split(':')
    await page.keyboard.down(code)
    await page.waitForTimeout(Number(ms))
    await page.keyboard.up(code)
  },
  press: (page, value) => page.keyboard.press(value),
  drag: async (page, value) => {
    const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = value.split(',').map(Number)
    await page.mouse.move(x1, y1)
    await page.mouse.down()
    await page.mouse.move(x2, y2, { steps: 12 })
    await page.mouse.up()
  },
  'await-text': (page, value) =>
    page.waitForFunction((t) => document.body.innerText.includes(t), value, { timeout: 30_000 }),
  'await-mode': (page, value) =>
    page.waitForFunction((m) => window.__scene?.mode === m, value, { timeout: 30_000 }),
  'await-path': (page, value) =>
    page.waitForFunction((path) => location.pathname === path, value, { timeout: 30_000 }),
  'steady-hover': async (page, value) => {
    const [x = 640, y = 360, count = 10] = value.split(',').map(Number)
    const samples: unknown[] = []
    for (let i = 0; i < count; i++) {
      await page.mouse.move(x + (i % 2), y)
      await page.waitForTimeout(150)
      samples.push(await page.evaluate(() => window.__scene?.hoverLabel ?? null))
    }
    const steady = samples.every((label) => label !== null && label === samples[0])
    console.log(`hover samples ${steady ? 'steady' : 'UNSTEADY'}: ${JSON.stringify(samples)}`)
    process.exitCode = steady ? process.exitCode : 1
  },
  wait: (page, value) => page.waitForTimeout(Number(value)),
  shot: async (page, value) => {
    await settle(page)
    await mkdir(SHOTS, { recursive: true })
    await page.screenshot({ path: resolve(SHOTS, `${value}.png`) })
    console.log(`✓ shots/${value}.png`)
  },
}

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox',
    '--hide-scrollbars',
  ],
})
const mobile = process.argv.includes('--mobile')
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 1,
  hasTouch: mobile,
  isMobile: mobile,
})
const errors: string[] = []
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

if (process.argv.includes('--nolock')) {
  await page.addInitScript(() => {
    Element.prototype.requestPointerLock = () => Promise.reject(new Error('pointer lock disabled'))
  })
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForFunction(() => window.__sceneReady === true, null, { timeout: 60_000 })
  for (const step of process.argv.slice(2).filter((a) => a.startsWith('--'))) {
    const [key = '', ...rest] = step.slice(2).split('=')
    const action = STEPS[key]
    if (action) {
      await action(page, rest.join('='))
    }
  }
  const scene = await page.evaluate(() => window.__scene)
  const renderer = await page.evaluate(() => window.__rendererInfo)
  const stats = await page.evaluate(() => window.__renderStats)
  console.log(`scene: ${JSON.stringify(scene)}\nstats: ${JSON.stringify(stats)}\nGL: ${renderer}`)
} catch (err) {
  process.exitCode = 1
  console.error(`✗ ${(err as Error).message}`)
} finally {
  if (errors.length) {
    console.error(`${errors.length} console message(s):\n  ${errors.slice(0, 15).join('\n  ')}`)
  }
  await browser.close()
}

declare global {
  interface Window {
    __sceneReady?: boolean
    __rendererInfo?: string
    __scene?: Record<string, unknown>
    __renderStats?: Record<string, number>
  }
}
