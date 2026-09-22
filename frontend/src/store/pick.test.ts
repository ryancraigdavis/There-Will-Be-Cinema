import { describe, expect, it } from 'vitest'
import type { AtlasIndex } from '../catalog/types'
import type { Slot } from './geometry'
import { buildPickIndex, pickTape, rayBox, slotBounds, tapeLocations } from './pick'

const index: AtlasIndex = {
  cell: [128, 192],
  size: 4096,
  cols: 32,
  rows: 21,
  version: 'v',
  count: 2,
  slots: { a: [0, 0, 0], b: [1, 0, 0], c: [0, 1, 0], twin: [0, 2, 0] },
}

// A face-out row along x at z = -1, covers facing +z (yaw = -π/2), 12.5 cm apart.
const row = (...ids: string[]): Slot[] =>
  ids.map((itemId, i) => ({ itemId, position: [i * 0.125, 1, -1], yaw: -Math.PI / 2 }))

const sections = buildPickIndex(
  [
    { id: 's1', slots: row('a', 'b', 'c') },
    { id: 's2', slots: [{ itemId: 'twin', position: [0, 1, -3], yaw: -Math.PI / 2 }] },
  ],
  index,
)

describe('slotBounds', () => {
  it.each([
    ['a cover facing +x', 0, [0.013, 0.095, 0.0525]],
    ['a cover facing +z', -Math.PI / 2, [0.0525, 0.095, 0.013]],
  ])('%s', (_name, yaw, half) => {
    const { min, max } = slotBounds({ itemId: 'x', position: [0, 0, 0], yaw })
    expect(max.map((v, i) => (v - (min[i] ?? 0)) / 2)).toEqual(
      half.map((v) => expect.closeTo(v, 4)),
    )
  })
})

describe('rayBox', () => {
  const box = { min: [-1, -1, -1] as const, max: [1, 1, 1] as const }
  it.each([
    ['head on', [0, 0, 5], [0, 0, -1], 4],
    ['from inside', [0, 0, 0], [0, 0, -1], 0],
    ['pointing away', [0, 0, 5], [0, 0, 1], null],
    ['missing to the side', [3, 0, 5], [0, 0, -1], null],
    ['along an axis-parallel edge direction', [0, 5, 0], [0, -1, 0], 4],
  ] as const)('%s', (_name, origin, direction, expected) => {
    expect(rayBox([...origin], [...direction], box)).toBe(expected)
  })
})

describe('pickTape', () => {
  it.each([
    ['the tape straight ahead', [0.125, 1, 0], [0, 0, -1], 'b'],
    ['a side face at a grazing angle', [-0.5, 1, -1], [1, 0, 0], 'a'],
    ['nothing in the gap between two tapes', [0.0625, 1, 0], [0, 0, -1], null],
    ['the nearer of two sections in line', [0, 1, 0], [0, 0, -1], 'a'],
    ['nothing beyond the pick range', [0, 1, 8], [0, 0, -1], null],
    ['nothing behind the player', [0, 1, 0], [0, 0, 1], null],
    ['the tape behind a hidden one', [0, 1, 0], [0, 0, -1], 'twin', 'a'],
  ] as const)('finds %s', (_name, origin, direction, expected, hidden?: string) => {
    const hit = pickTape([...origin], [...direction], 6, sections, hidden ?? null)
    expect(hit?.slot.itemId ?? null).toBe(expected)
  })

  it('reports the instance inside its atlas batch', () => {
    const hit = pickTape([0.125, 1, 0], [0, 0, -1], 6, sections)
    expect(hit?.slot).toMatchObject({ key: 's1:1', instance: 0 })
    expect(pickTape([0.25, 1, 0], [0, 0, -1], 6, sections)?.slot).toMatchObject({
      key: 's1:0',
      instance: 1,
    })
  })
})

describe('tapeLocations', () => {
  it('maps every film to each place it sits', () => {
    const twice = buildPickIndex(
      [
        { id: 'genre', slots: row('a') },
        { id: 'endcap', slots: row('a', 'b') },
      ],
      index,
    )
    expect(tapeLocations(twice).get('a')).toEqual([
      { key: 'genre:0', instance: 0 },
      { key: 'endcap:0', instance: 0 },
    ])
    expect(tapeLocations(twice).get('b')).toEqual([{ key: 'endcap:1', instance: 0 }])
  })
})
