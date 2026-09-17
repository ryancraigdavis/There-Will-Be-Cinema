import { describe, expect, it } from 'vitest'
import type { AtlasIndex } from '../catalog/types'
import { availableLevels, levelFor } from './lod'

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
    ['close on desktop', 1, 4096, 4096],
    ['mid range', 5, 4096, 2048],
    ['far away', 20, 4096, 1024],
    ['close on a phone', 1, 2048, 2048],
    ['far on a phone', 20, 2048, 1024],
  ])('%s', (_name, distance, maxSize, expected) => {
    expect(levelFor(distance, [1024, 2048, 4096], maxSize)).toBe(expected)
  })

  it('waits until you stop walking before loading the full sheet', () => {
    const levels = [1024, 2048, 4096]
    expect(levelFor(1, levels, 4096, { settled: false })).toBe(2048)
    expect(levelFor(1, levels, 4096, { settled: true })).toBe(4096)
  })

  it.each([
    ['keeps the full sheet a step past the threshold', 3.8, 4096, 4096],
    ['lets it go further away', 4.5, 4096, 2048],
    ['does not jump to it from the middle level', 3.8, 2048, 2048],
  ])('%s', (_name, distance, current, expected) => {
    expect(levelFor(distance, [1024, 2048, 4096], 4096, { settled: false, current })).toBe(expected)
  })

  it('uses the only level a legacy index has', () => {
    expect(levelFor(20, [4096], 4096)).toBe(4096)
    expect(levelFor(1, [], 4096)).toBeNull()
  })
})
