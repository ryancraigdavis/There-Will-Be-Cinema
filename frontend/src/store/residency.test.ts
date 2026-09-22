import { describe, expect, it } from 'vitest'
import { type Demand, nearestPerSheet, planFull, type Residency } from './residency'

const budget = { fullSheets: 2, fullDistance: 2, hold: 1 }
const idle: Residency = { resident: [], loading: null }
const demands = (...pairs: [number, number][]): Demand[] =>
  pairs.map(([sheet, distance]) => ({ sheet, distance })).sort((a, b) => a.distance - b.distance)

describe('nearestPerSheet', () => {
  it('keeps the nearest section of each sheet and drops slots with no atlas', () => {
    const box = (x: number, z: number) => ({ minX: x, maxX: x, minZ: z, maxZ: z })
    const batches = [
      { atlas: 0, bounds: box(0, -5) },
      { atlas: 0, bounds: box(0, -1) },
      { atlas: 3, bounds: box(4, 0) },
      { atlas: -1, bounds: box(0, 0) },
    ]
    expect(nearestPerSheet(batches, 0, 0)).toEqual([
      { sheet: 0, distance: 1 },
      { sheet: 3, distance: 4 },
    ])
  })
})

describe('planFull', () => {
  it.each([
    ['nothing near', demands([0, 5], [1, 9]), idle, true, null],
    ['the nearest sheet in range', demands([0, 1.5], [1, 1.9]), idle, true, 0],
    ['nothing while still walking', demands([0, 1.5]), idle, false, null],
    [
      'nothing while another sheet loads',
      demands([0, 1], [1, 1.5]),
      { resident: [], loading: 0 },
      true,
      null,
    ],
    [
      'the next sheet once one is resident',
      demands([0, 1], [1, 1.5]),
      { resident: [0], loading: null },
      true,
      1,
    ],
    [
      'nothing past the budget',
      demands([0, 1], [1, 1.5], [2, 1.8]),
      { resident: [0, 1], loading: null },
      true,
      null,
    ],
  ])('loads %s', (_name, near, state, settled, expected) => {
    expect(planFull(near, state, settled, budget).load).toBe(expected)
  })

  it.each([
    ['a sheet still in the hold band', demands([0, 2.5]), { resident: [0], loading: null }, [], []],
    [
      'a sheet that fell out of range, with grace',
      demands([0, 3.5]),
      { resident: [0], loading: null },
      [],
      [0],
    ],
    [
      'the farthest sheet when a nearer one wants in',
      demands([2, 0.5], [0, 1], [1, 1.5]),
      { resident: [0, 1], loading: null },
      [1],
      [],
    ],
  ])('drops %s', (_name, near, state, evict, release) => {
    const plan = planFull(near, state, true, budget)
    expect(plan.evict).toEqual(evict)
    expect(plan.release).toEqual(release)
  })

  it.each([
    ['a load whose sheet walked out of range', demands([0, 4]), { resident: [], loading: 0 }, 0],
    [
      'a load pushed out by two nearer sheets',
      demands([1, 0.5], [2, 0.6], [0, 1.9]),
      { resident: [1, 2], loading: 0 },
      0,
    ],
    [
      'nothing when the load is still wanted',
      demands([0, 2.8]),
      { resident: [], loading: 0 },
      null,
    ],
  ])('cancels %s', (_name, near, state, expected) => {
    expect(planFull(near, state, true, budget).cancel).toBe(expected)
  })

  it('evicts the farthest resident sheet and loads the nearer one in the same tick', () => {
    const plan = planFull(
      demands([2, 0.5], [0, 1], [1, 1.5]),
      { resident: [0, 1], loading: null },
      true,
      budget,
    )
    expect(plan).toEqual({ load: 2, cancel: null, evict: [1], release: [] })
  })
})
