import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { LETTER_GRID, LETTER_SHEET } from '../store/letters'
import { PALETTE } from './palette'

function rng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  draw(ctx)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function cached<T>(make: () => T): () => T {
  let value: T | undefined
  return () => {
    value ??= make()
    return value
  }
}

export const carpetTexture = cached(() => {
  const texture = canvasTexture(512, 512, (ctx) => {
    const random = rng(1990)
    ctx.fillStyle = '#2a0f0a'
    ctx.fillRect(0, 0, 512, 512)
    const colors = [PALETTE.rust, PALETTE.rustBright, PALETTE.sunset, PALETTE.gold, '#5c2414']
    for (let i = 0; i < 260; i++) {
      ctx.save()
      ctx.translate(random() * 512, random() * 512)
      ctx.rotate(random() * Math.PI)
      ctx.globalAlpha = 0.35 + random() * 0.45
      ctx.fillStyle = colors[Math.floor(random() * colors.length)] ?? PALETTE.rust
      const size = 4 + random() * 10
      ctx.fillRect(-size / 2, -1.5, size, 3)
      ctx.restore()
    }
  })
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
})

export const ceilingTexture = cached(() => {
  const texture = canvasTexture(256, 256, (ctx) => {
    const random = rng(42)
    ctx.fillStyle = PALETTE.ceiling
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(60, 45, 30, ${random() * 0.25})`
      ctx.fillRect(random() * 256, random() * 256, 1.5, 1.5)
    }
    ctx.strokeStyle = '#6f6454'
    ctx.lineWidth = 6
    ctx.strokeRect(0, 0, 256, 256)
  })
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
})

export const corkTexture = cached(() => {
  const texture = canvasTexture(256, 256, (ctx) => {
    const random = rng(7)
    ctx.fillStyle = '#8a5a32'
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 2600; i++) {
      const shade = random() > 0.5 ? '255, 214, 160' : '60, 30, 12'
      ctx.fillStyle = `rgba(${shade}, ${random() * 0.35})`
      ctx.fillRect(random() * 256, random() * 256, 2, 2)
    }
  })
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
})

export const crtTexture = cached(() =>
  canvasTexture(320, 240, (ctx) => {
    ctx.fillStyle = '#060a06'
    ctx.fillRect(0, 0, 320, 240)
    ctx.fillStyle = PALETTE.gold
    ctx.font = 'bold 22px monospace'
    const lines = [
      'TWBC VIDEO',
      'RENTAL SYS v1.0',
      '',
      '> MEMBER LOOKUP',
      '> RETURNS',
      '> NEW RELEASES',
      '',
      'READY_',
    ]
    lines.forEach((line, i) => {
      ctx.fillText(line, 18, 34 + i * 26)
    })
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
    for (let y = 0; y < 240; y += 3) {
      ctx.fillRect(0, y, 320, 1)
    }
  }),
)

export function noteTexture(lines: readonly string[], seed: number) {
  return canvasTexture(256, 256, (ctx) => {
    const random = rng(seed)
    ctx.fillStyle = '#f1e6cc'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = `rgba(120, 90, 50, ${0.08 + random() * 0.08})`
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = PALETTE.rust
    ctx.font = 'bold 30px "Arial Narrow", Arial, sans-serif'
    ctx.fillText(lines[0] ?? '', 18, 48)
    ctx.fillStyle = '#231a14'
    ctx.font = '22px "Comic Sans MS", "Marker Felt", cursive'
    lines.slice(1).forEach((line, i) => {
      ctx.fillText(line, 18, 96 + i * 34)
    })
  })
}

export const kioskTexture = cached(() =>
  canvasTexture(320, 240, (ctx) => {
    ctx.fillStyle = '#07090c'
    ctx.fillRect(0, 0, 320, 240)
    ctx.strokeStyle = PALETTE.gold
    ctx.lineWidth = 4
    ctx.strokeRect(10, 10, 300, 220)
    ctx.fillStyle = PALETTE.sunset
    ctx.font = 'bold 24px monospace'
    ctx.fillText('SEARCH THE', 34, 62)
    ctx.fillStyle = PALETTE.gold
    ctx.font = 'bold 56px monospace'
    ctx.fillText('CATALOG', 34, 124)
    ctx.fillStyle = PALETTE.cream
    ctx.font = '20px monospace'
    ctx.fillText('> TOUCH TO START_', 34, 190)
  }),
)

export const letterTexture = cached(() =>
  canvasTexture(512, 256, (ctx) => {
    const cell = 64
    ctx.fillStyle = PALETTE.cream
    ctx.fillRect(0, 0, 512, 256)
    ctx.fillStyle = PALETTE.rust
    ctx.font = 'bold 54px "Arial Narrow", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    LETTER_SHEET.split('').forEach((letter, i) => {
      const col = i % LETTER_GRID.cols
      const row = Math.floor(i / LETTER_GRID.cols)
      ctx.fillText(letter, col * cell + cell / 2, row * cell + cell / 2 + 2)
    })
  }),
)
