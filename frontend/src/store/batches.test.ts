import { describe, expect, it } from 'vitest'
import type { AtlasIndex } from '../catalog/types'
import { cellOrigin, cellSize, groupSlotsByAtlas, NO_ATLAS } from './batches'
import type { Slot } from './layout'

const index: AtlasIndex = {
  cell: [128, 192],
  size: 4096,
  cols: 32,
  rows: 21,
  version: 'v',
  count: 2,
  slots: { a: [1, 0, 0], b: [0, 31, 20], c: [1, 2, 1] },
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
