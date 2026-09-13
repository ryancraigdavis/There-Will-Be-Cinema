import { describe, expect, it } from 'vitest'
import { toItem } from '../api'
import type { CatalogItem } from '../catalog/types'
import { boxesOverlap } from '../player/collision'
import { rawItem } from '../test/fixtures'
import { BOX, GONDOLA, OTHER_GENRE, SHELF } from './constants'
import {
  addressOf,
  BACK_Z,
  buildStorePlan,
  FACE_OFFSET,
  FACES,
  groupByGenre,
  ROWS_PER_FACE,
  toRows,
} from './layout'

function movies(genre: string, count: number, prefix = genre): CatalogItem[] {
  return Array.from({ length: count }, (_, i) =>
    toItem(
      rawItem({
        id: `${prefix}-${i}`,
        ti: `${prefix} ${String(i).padStart(4, '0')}`,
        st: `${prefix} ${String(i).padStart(4, '0')}`.toLowerCase(),
        pg: genre,
        g: [genre],
      }),
    ),
  )
}

const series = toItem(rawItem({ id: 'show', t: 'Series', pg: 'Drama' }))
const library = [
  ...movies('Action', 50),
  ...movies('Drama', 700),
  ...movies('Exercise', 5),
  ...movies('Talk Show', 3),
  series,
]

describe('groupByGenre', () => {
  const groups = groupByGenre(library.filter((item) => item.type === 'Movie'))

  it('orders genres by size and folds small ones into the last group', () => {
    expect(groups.map((g) => [g.genre, g.items.length])).toEqual([
      ['Drama', 700],
      ['Action', 50],
      [OTHER_GENRE, 8],
    ])
  })

  it('alphabetizes inside a genre', () => {
    expect(groups[0]?.items.slice(0, 2).map((item) => item.id)).toEqual(['Drama-0', 'Drama-1'])
  })

  it('starts every genre on a fresh shelf', () => {
    const rows = toRows(groups)
    expect(rows).toHaveLength(22 + 2 + 1)
    expect(rows[22]?.genre).toBe('Action')
    expect(rows[21]?.itemIds).toHaveLength(700 % SHELF.slots)
  })
})

describe('addressOf', () => {
  it.each([
    [0, { face: 0, section: 0, shelf: 0 }],
    [4, { face: 0, section: 0, shelf: 4 }],
    [5, { face: 0, section: 1, shelf: 0 }],
    [ROWS_PER_FACE, { face: 1, section: 0, shelf: 0 }],
  ])('row %s', (row, expected) => {
    expect(addressOf(row)).toEqual(expected)
  })
})

describe('buildStorePlan', () => {
  const plan = buildStorePlan(library)
  const slots = plan.sections.flatMap((section) => section.slots)

  it('shelves every movie once and leaves series out', () => {
    const ids = slots.map((slot) => slot.itemId)
    expect(ids).toHaveLength(758)
    expect(new Set(ids).size).toBe(758)
    expect(ids).not.toContain('show')
    expect(plan.overflow).toEqual([])
  })

  it('is deterministic', () => {
    expect(buildStorePlan([...library].reverse())).toEqual(plan)
  })

  it('starts at the front of the center aisle, top shelf, spine facing the aisle', () => {
    const first = plan.sections[0]?.slots[0]
    const gondola = GONDOLA.xs[FACES[0]?.gondola ?? 0] ?? 0
    expect(first?.itemId).toBe('Drama-0')
    expect(first?.yaw).toBeCloseTo(Math.PI / 2)
    expect(first?.position[0]).toBeGreaterThan(gondola)
    expect(first?.position[1]).toBeCloseTo(SHELF.topY + BOX.height / 2)
    expect(first?.position[2]).toBeLessThan(GONDOLA.frontZ)
    expect(first?.position[2]).toBeGreaterThan(GONDOLA.frontZ - 0.1)
  })

  it('reads deeper into the store along a face', () => {
    const section = plan.sections[0]
    expect(section?.slots[1]?.position[2]).toBeLessThan(section?.slots[0]?.position[2] ?? 0)
  })

  it('labels a section with every genre on it', () => {
    const shared = plan.sections.find((section) => section.index === 4)
    expect(shared?.genres).toEqual(['Drama', 'Action', OTHER_GENRE])
    expect(shared?.sign.label).toBe(`Drama · Action · ${OTHER_GENRE}`)
  })

  it('keeps every box inside its gondola', () => {
    const halfCover = BOX.cover / 2
    const inside = slots.every((slot) => {
      const nearest = GONDOLA.xs.reduce((best, x) =>
        Math.abs(x - slot.position[0]) < Math.abs(best - slot.position[0]) ? x : best,
      )
      const offset = Math.abs(slot.position[0] - nearest)
      return (
        offset + halfCover <= FACE_OFFSET &&
        slot.position[2] <= GONDOLA.frontZ &&
        slot.position[2] >= BACK_Z &&
        slot.position[1] > 0
      )
    })
    expect(inside).toBe(true)
  })

  it('does not overlap gondolas', () => {
    const [a, b, c, d] = plan.colliders
    expect([a, b, c, d].every(Boolean)).toBe(true)
    const pairs = plan.colliders.flatMap((x, i) => plan.colliders.slice(i + 1).map((y) => [x, y]))
    expect(pairs.some(([x, y]) => x && y && boxesOverlap(x, y))).toBe(false)
  })

  it('reports what does not fit', () => {
    const huge = buildStorePlan(movies('Drama', FACES.length * ROWS_PER_FACE * SHELF.slots + 10))
    expect(huge.overflow).toHaveLength(10)
  })
})
