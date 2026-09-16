import { describe, expect, it } from 'vitest'
import { toItem } from '../api'
import type { CatalogItem, Collection } from '../catalog/types'
import { boxesOverlap } from '../player/collision'
import { rawItem } from '../test/fixtures'
import { GONDOLA, OTHER_GENRE } from './constants'
import { buildStorePlan, groupByGenre } from './layout'
import { GENRE_RUNS, runCollider, slotCapacity } from './runs'

function movies(genre: string, count: number, prefix = genre): CatalogItem[] {
  return Array.from({ length: count }, (_, i) => {
    const title = `${prefix} ${String(i).padStart(4, '0')}`
    return toItem(
      rawItem({ id: `${prefix}-${i}`, ti: title, st: title.toLowerCase(), pg: genre, g: [genre] }),
    )
  })
}

const series = toItem(rawItem({ id: 'show', t: 'Series', pg: 'Drama' }))
const library = [
  ...movies('Action', 50),
  ...movies('Drama', 700),
  ...movies('Exercise', 5),
  ...movies('Talk Show', 3),
  series,
]
const picks: Collection = {
  id: 'c',
  name: 'Staff Picks',
  overview: null,
  imageTag: null,
  itemIds: ['Drama-0', 'Drama-1', 'Action-0', 'Action-1'],
}

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
})

describe('buildStorePlan', () => {
  const plan = buildStorePlan(library, [picks])
  const genreSlots = plan.sections
    .filter((section) => section.run.kind === 'genre')
    .flatMap((section) => section.slots)

  it('shelves every movie once on the genre runs and leaves series off them', () => {
    const ids = genreSlots.map((slot) => slot.itemId)
    expect(ids).toHaveLength(758)
    expect(new Set(ids).size).toBe(758)
    expect(ids).not.toContain('show')
    expect(plan.overflow).toEqual([])
  })

  it('is deterministic', () => {
    expect(buildStorePlan([...library].reverse(), [picks])).toEqual(plan)
  })

  it('starts face-out at the front of the center aisle', () => {
    const first = genreSlots[0]
    expect(first?.itemId).toBe('Drama-0')
    expect(first?.yaw).toBeCloseTo(0)
    expect(first?.position[0]).toBeGreaterThan(GONDOLA.xs[1] ?? 0)
    expect(first?.position[2]).toBeGreaterThan(GONDOLA.frontZ - 0.15)
    expect(genreSlots[1]?.position[2]).toBeLessThan(first?.position[2] ?? 0)
  })

  it('gives every bay one genre, signed with its letter range', () => {
    const bays = plan.sections.filter((section) => section.run.kind === 'genre')
    expect(bays.every((section) => section.labels.length === 1)).toBe(true)
    const genreSigns = plan.signs.filter((sign) => sign.label !== 'New Releases')
    expect(genreSigns[0]?.label).toBe('Drama D')
    expect(genreSigns.filter((sign) => sign.label.startsWith('Action'))).toHaveLength(2)
    expect(genreSigns.some((sign) => sign.label === 'More Movies E–T')).toBe(true)
  })

  it('names each aisle, lists it in the directory, and tabs the letters', () => {
    expect(plan.banners.map((banner) => banner.label)).toContain('Aisle 3')
    expect(plan.directory.map((entry) => entry.genre)).toEqual(['Action', 'Drama', 'More Movies'])
    expect(plan.directory.find((entry) => entry.genre === 'Drama')?.aisle).toBe('Aisle 3')
    expect(plan.dividers[0]?.letter).toBe('D')
  })

  it('keeps every tape on its own shelf run', () => {
    const outside = plan.sections.flatMap((section) => {
      const box = runCollider(section.run)
      return section.slots.filter(
        ({ position: [x, , z] }) =>
          x < box.minX - 0.01 || x > box.maxX + 0.01 || z < box.minZ - 0.01 || z > box.maxZ + 0.01,
      )
    })
    expect(outside).toEqual([])
  })

  it('does not overlap any fixtures', () => {
    const clashes = plan.colliders.flatMap((a, i) =>
      plan.colliders.slice(i + 1).filter((b) => boxesOverlap(a, b)),
    )
    expect(clashes).toEqual([])
  })

  it('reports movies that do not fit', () => {
    const capacity = GENRE_RUNS.reduce((sum, run) => sum + slotCapacity(run), 0)
    expect(buildStorePlan(movies('Drama', capacity + 10)).overflow).toHaveLength(10)
  })
})
