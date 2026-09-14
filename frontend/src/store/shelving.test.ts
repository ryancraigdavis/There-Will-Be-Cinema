import { describe, expect, it } from 'vitest'
import type { Collection } from '../catalog/types'
import { catalogFixture } from '../test/fixtures'
import { buildStorePlan } from './layout'
import { NEW_RELEASES_SPEC } from './runs'
import { shelvingParts } from './shelving'

const staffPicks: Collection = {
  id: 'c1',
  name: 'Staff Picks',
  overview: null,
  imageTag: null,
  itemIds: ['twbb', 'alien', 'aliens', 'amelie'],
}

describe('shelvingParts', () => {
  const plan = buildStorePlan(catalogFixture().items, [staffPicks])
  const parts = shelvingParts(plan.gondolas, plan.runs)
  const rows = plan.runs.reduce((sum, run) => sum + run.rows, 0)

  it('gives every shelf row a board and a trim', () => {
    expect(parts.boards).toHaveLength(rows)
    expect(parts.trims).toHaveLength(rows)
  })

  it('backs every run and gives gondolas a divider and two end panels', () => {
    expect(parts.panels).toHaveLength(plan.gondolas.length * 3 + plan.runs.length)
    expect(parts.blocks).toHaveLength(plan.runs.length * 2)
  })

  it('turns wall parts to run along their wall', () => {
    expect(shelvingParts([], [NEW_RELEASES_SPEC]).boards[0]?.yaw).toBeCloseTo(-Math.PI / 2)
  })

  it('only makes solid, positive sizes', () => {
    const all = [...parts.boards, ...parts.trims, ...parts.panels, ...parts.blocks]
    expect(all.every((part) => part.size.every((value) => value > 0))).toBe(true)
  })
})
