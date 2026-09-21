import { describe, expect, it } from 'vitest'
import { classify, createFrameStats, percentile, pushFrame, recent, summarize } from './frameStats'

describe('frame stats', () => {
  it.each([
    ['a smooth frame', 16.7, 'ok'],
    ['exactly one missed vsync', 25, 'ok'],
    ['just past a missed vsync', 25.1, 'slow'],
    ['the hitch boundary', 50, 'slow'],
    ['a hitch', 50.1, 'hitch'],
    ['the freeze boundary', 100, 'hitch'],
    ['a freeze', 400, 'freeze'],
  ])('classifies %s', (_name, ms, expected) => {
    expect(classify(ms)).toBe(expected)
  })

  it.each([
    ['nothing pushed', [], []],
    ['fewer than capacity', [1, 2], [1, 2]],
    ['wrapped around', [1, 2, 3, 4, 5], [4, 5, 3]],
  ])('keeps the most recent samples: %s', (_name, pushed, expected) => {
    const stats = createFrameStats(3)
    for (const ms of pushed) {
      pushFrame(stats, ms)
    }
    expect(recent(stats)).toEqual(expected)
  })

  it.each([
    ['median', 0.5, 51],
    ['p95', 0.95, 96],
    ['p99', 0.99, 100],
    ['beyond the end', 1, 100],
  ])('reads the %s of 1..100', (_name, p, expected) => {
    const sorted = Array.from({ length: 100 }, (_, i) => i + 1)
    expect(percentile(sorted, p)).toBe(expected)
  })

  it('summarizes an empty run as zeros', () => {
    expect(summarize([])).toEqual({
      frames: 0,
      mean: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      max: 0,
      slow: 0,
      hitch: 0,
      freeze: 0,
    })
  })

  it('counts each long frame once, by its worst class', () => {
    const summary = summarize([16, 16, 30, 60, 120, 16])
    expect(summary).toMatchObject({ frames: 6, max: 120, slow: 1, hitch: 1, freeze: 1 })
    expect(summary.mean).toBeCloseTo(43)
  })
})
