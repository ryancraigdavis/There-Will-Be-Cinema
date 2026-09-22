import { describe, expect, it } from 'vitest'
import type { AtlasIndex } from '../catalog/types'
import { atlasOf, cellOrigin, cellSize, groupSlotsByAtlas, isDisplayRun, NO_ATLAS } from './batches'
import type { Slot } from './geometry'

const index: AtlasIndex = {
  cell: [128, 192],
  size: 4096,
  cols: 32,
  rows: 21,
  version: 'v',
  count: 2,
  slots: { a: [1, 0, 0], b: [0, 31, 20], c: [1, 2, 1] },
  display: { a: [2, 5, 0] },
}

const slot = (itemId: string): Slot => ({ itemId, position: [0, 0, 0], yaw: 0 })

describe('atlas batches', () => {
  it('groups slots by atlas and keeps shelf order inside a batch', () => {
    const batches = groupSlotsByAtlas([slot('a'), slot('x'), slot('b'), slot('c')], index)
    expect(batches.map((b) => [b.atlas, b.slots.map((s) => s.itemId)])).toEqual([
      [NO_ATLAS, ['x']],
      [0, ['b']],
      [1, ['a', 'c']],
    ])
  })

  it.each([
    ['a genre shelf keeps the genre slot', false, 1, [0, 1 - 192 / 4096]],
    ['a display run uses the display slot', true, 2, [(5 * 128) / 4096, 1 - 192 / 4096]],
  ])('%s', (_name, display, atlas, origin) => {
    expect(atlasOf('a', index, display)).toBe(atlas)
    expect(cellOrigin('a', index, display).slice(0, 2)).toEqual(
      origin.map((v) => expect.closeTo(v, 6)),
    )
  })

  it('falls back to the genre slot when a display run item has no display cell', () => {
    expect(atlasOf('b', index, true)).toBe(0)
    expect(groupSlotsByAtlas([slot('a'), slot('b')], index, true).map((b) => b.atlas)).toEqual([
      0, 2,
    ])
  })

  it.each([
    ['new-releases', true],
    ['endcap', true],
    ['genre', false],
    ['tv', false],
    [undefined, false],
  ] as const)('%s is a display run: %s', (kind, expected) => {
    expect(isDisplayRun(kind)).toBe(expected)
  })

  it('treats a missing index as posterless', () => {
    expect(groupSlotsByAtlas([slot('a')], null).map((b) => b.atlas)).toEqual([NO_ATLAS])
    expect(cellOrigin('a', null)).toEqual([0, 0, 0])
  })

  it('maps cells with the top row at the top of the texture', () => {
    const [du, dv] = cellSize(index)
    expect(du).toBeCloseTo(128 / 4096)
    expect(cellOrigin('a', index)).toEqual([0, 1 - dv, 1])
    const [u, v, textured] = cellOrigin('b', index)
    expect(u).toBeCloseTo(31 * du)
    expect(v).toBeCloseTo(1 - 21 * dv)
    expect(textured).toBe(1)
  })
})
