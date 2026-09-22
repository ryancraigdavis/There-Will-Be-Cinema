import { describe, expect, it } from 'vitest'
import type { AtlasIndex } from '../catalog/types'
import { availableLevels, coverPixels, fullDistance, fullLevel, usableLevels } from './lod'

const index = (levels?: number[]): AtlasIndex => ({
  cell: [128, 192],
  size: 4096,
  cols: 32,
  rows: 21,
  version: 'v',
  count: 1,
  slots: {},
  levels,
})

describe('lod', () => {
  it('lists levels smallest first and falls back to the full sheet', () => {
    expect(availableLevels(index([4096, 1024, 2048]))).toEqual([1024, 2048, 4096])
    expect(availableLevels(index())).toEqual([4096])
    expect(availableLevels(null)).toEqual([])
  })

  it.each([
    ['desktop skips the tier below the warm one', 4096, 2048, [2048, 4096]],
    ['phones warm 1024 and top out at 2048', 2048, 1024, [1024, 2048]],
    ['a legacy single-size index', 4096, 4096, [4096]],
    ['no warm level yet', 4096, null, [1024, 2048, 4096]],
  ])('%s', (_name, maxSize, warm, expected) => {
    expect(usableLevels([1024, 2048, 4096], maxSize, warm)).toEqual(expected)
  })

  it.each([
    ['the sharp tier above warm', [2048, 4096], 2048, 4096],
    ['nothing above warm', [4096], 4096, null],
    ['nothing at all', [], null, null],
  ])('full level: %s', (_name, usable, warm, expected) => {
    expect(fullLevel(usable, warm)).toBe(expected)
  })

  it.each([
    ['1440p at 66°, 2048 warm', 1440, 66, 96, 2.19],
    ['720p at 66°, 2048 warm', 720, 66, 96, 1.1],
    ['a 4K window is capped', 2160, 66, 96, 3],
    ['a tiny window is floored', 300, 66, 96, 1],
    ['a phone with 1024 warm', 844 * 3, 100, 48, 3],
  ])('%s', (_name, px, fov, cellPx, expected) => {
    expect(fullDistance(px, fov, cellPx)).toBeCloseTo(expected, 1)
  })

  it('knows how tall a cover is at each level', () => {
    expect(coverPixels(index(), 2048)).toBe(96)
    expect(coverPixels(index(), 4096)).toBe(192)
  })
})
