import { describe, expect, it } from 'vitest'
import type { AtlasIndex } from '../catalog/types'
import type { Slot } from './geometry'
import { distanceToBounds, runBatches, slotBounds, slotLocations } from './tapeBatches'

const index: AtlasIndex = {
  cell: [128, 192],
  size: 4096,
  cols: 32,
  rows: 21,
  version: 'v',
  count: 3,
  slots: { a: [0, 0, 0], b: [1, 0, 0], c: [0, 1, 0], d: [1, 1, 0] },
  display: { a: [2, 0, 0] },
}

const slot = (itemId: string, x: number, z = -1): Slot =>
  ({
    itemId,
    position: [x, 1, z],
    yaw: 0,
  }) as Slot

const genre = { id: 'g', kind: 'genre' as const }
const endcap = { id: 'e', kind: 'endcap' as const }

describe('runBatches', () => {
  it('merges the sections of one run face into one batch per sheet, in section order', () => {
    const batches = runBatches(
      [
        { id: 'g-0', run: genre, slots: [slot('a', 0), slot('b', 1)] },
        { id: 'g-1', run: genre, slots: [slot('c', 2), slot('d', 3)] },
      ],
      index,
    )
    expect(batches.map((batch) => [batch.key, batch.slots.map((s) => s.itemId)])).toEqual([
      ['g:0', ['a', 'c']],
      ['g:1', ['b', 'd']],
    ])
    expect(batches[0]?.bounds).toEqual({ minX: 0, maxX: 2, minZ: -1, maxZ: -1 })
    expect(batches.every((batch) => !batch.display)).toBe(true)
  })

  it('keeps different runs apart and uses display slots on display runs', () => {
    const batches = runBatches(
      [
        { id: 'g-0', run: genre, slots: [slot('a', 0)] },
        { id: 'e-0', run: endcap, slots: [slot('a', 5), slot('b', 6)] },
      ],
      index,
    )
    expect(batches.map((batch) => [batch.key, batch.display])).toEqual([
      ['g:0', false],
      ['e:1', true],
      ['e:2', true],
    ])
  })

  it('locates every slot by identity', () => {
    const first = slot('a', 0)
    const second = slot('c', 1)
    const batches = runBatches([{ id: 'g-0', run: genre, slots: [first, second] }], index)
    const locations = slotLocations(batches)
    expect(locations.get(first)).toEqual({ key: 'g:0', instance: 0 })
    expect(locations.get(second)).toEqual({ key: 'g:0', instance: 1 })
    expect(locations.get(slot('a', 0))).toBeUndefined()
  })

  it('bounds an empty list without blowing up the caller', () => {
    expect(slotBounds([slot('a', 2, -3)])).toEqual({ minX: 2, maxX: 2, minZ: -3, maxZ: -3 })
  })
})

describe('distanceToBounds', () => {
  const box = { minX: -1, maxX: 1, minZ: -5, maxZ: -4 }
  it.each([
    ['inside', 0, -4.5, 0],
    ['straight in front', 0, -2, 2],
    ['off a corner', 4, -1, 3 * Math.SQRT2],
    ['beside it', -3, -4.2, 2],
  ])('%s', (_name, x, z, expected) => {
    expect(distanceToBounds(box, x, z)).toBeCloseTo(expected, 6)
  })
})
