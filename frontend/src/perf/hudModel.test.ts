import { describe, expect, it } from 'vitest'
import { hudLines, longLine, perFrame, staleLevels } from './hudModel'
import { createRecorder } from './recorder'

describe('perf hud', () => {
  it('turns totals into per-frame rates between two snapshots', () => {
    const perf = createRecorder()
    perf.count('raycast.tests', 100)
    perf.endFrame(16)
    const before = perf.snapshot()
    perf.count('raycast.tests', 300)
    perf.endFrame(16)
    perf.endFrame(16)
    expect(perFrame(before, perf.snapshot())).toEqual({ 'raycast.tests': 150 })
    expect(perFrame(before, before)).toEqual({ 'raycast.tests': 0 })
  })

  it.each([
    ['all three levels', [1024, 2048, 4096], false],
    ['the stale 4096-only index', [4096], true],
    ['no index yet', [], false],
  ])('%s', (_name, levels, expected) => {
    expect(staleLevels(levels)).toBe(expected)
  })

  it('names the slowest thing in a long frame', () => {
    const perf = createRecorder()
    perf.event('upload 3.webp 4/9', 58)
    perf.event('detail clear-space raycast', 3)
    perf.endFrame(61.4)
    const [entry] = perf.report().long
    expect(entry && longLine(entry)).toBe('#0 61ms load: upload 3.webp 4/9 58ms')
  })

  it('says so when a long frame recorded nothing', () => {
    const perf = createRecorder()
    perf.endFrame(80)
    const [entry] = perf.report().long
    expect(entry && longLine(entry)).toBe('#0 80ms load: nothing recorded')
  })

  it('lays out the panel and flags a stale index', () => {
    const perf = createRecorder()
    perf.gauge('draws', 212)
    perf.gauge('tex.mb.2048', 134.4)
    perf.endFrame(20)
    const lines = hudLines(perf.snapshot(), { 'raycast.passes': 1 }, [4096])
    expect(lines[0]).toBe('fps 50  p95 20.0  p99 20.0  max 20')
    expect(lines[2]).toContain('draws 212')
    expect(lines[3]).toContain('2048:134')
    expect(lines[5]).toContain('rays/f 1.00')
    expect(lines[6]).toBe('levels 4096  STALE INDEX: 4096 only')
    expect(hudLines(perf.snapshot(), {}, [1024, 2048, 4096])[6]).toBe('levels 1024 2048 4096')
  })
})
