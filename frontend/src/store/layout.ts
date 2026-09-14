import { titleCollator } from '../catalog/collate'
import type { CatalogItem, Collection } from '../catalog/types'
import type { AABB } from '../player/collision'
import { GONDOLA, MIN_GENRE_SIZE, OTHER_GENRE, SIGN_SIZE } from './constants'
import { buildDisplays } from './displays'
import { fillRows, rowSlots, type ShelfSection, sectionSigns, sectionsFrom } from './fill'
import { BACK_Z, type Sign } from './geometry'
import { GENRE_RUNS, type RunSpec, runCollider } from './runs'

export interface GondolaFrame {
  index: number
  x: number
  frontZ: number
  backZ: number
}

export interface GenreGroup {
  genre: string
  items: CatalogItem[]
}

export interface StorePlan {
  runs: RunSpec[]
  sections: ShelfSection[]
  signs: Sign[]
  gondolas: GondolaFrame[]
  colliders: AABB[]
  overflow: string[]
}

function countBy<T>(values: readonly T[], key: (value: T) => string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) {
    counts.set(key(value), (counts.get(key(value)) ?? 0) + 1)
  }
  return counts
}

function byTitle(a: CatalogItem, b: CatalogItem): number {
  return titleCollator.compare(a.sortTitle, b.sortTitle) || a.id.localeCompare(b.id)
}

function byShelfOrder(a: GenreGroup, b: GenreGroup): number {
  const otherLast = Number(a.genre === OTHER_GENRE) - Number(b.genre === OTHER_GENRE)
  return otherLast || b.items.length - a.items.length || titleCollator.compare(a.genre, b.genre)
}

export function groupByGenre(
  items: readonly CatalogItem[],
  minSize = MIN_GENRE_SIZE,
): GenreGroup[] {
  const counts = countBy(items, (item) => item.primaryGenre)
  const buckets = new Map<string, CatalogItem[]>()
  for (const item of items) {
    const genre = (counts.get(item.primaryGenre) ?? 0) >= minSize ? item.primaryGenre : OTHER_GENRE
    const bucket = buckets.get(genre) ?? []
    bucket.push(item)
    buckets.set(genre, bucket)
  }
  return [...buckets]
    .map(([genre, grouped]) => ({ genre, items: grouped.sort(byTitle) }))
    .sort(byShelfOrder)
}

export function buildStorePlan(
  items: readonly CatalogItem[],
  collections: readonly Collection[] = [],
): StorePlan {
  const movies = items.filter((item) => item.type === 'Movie')
  const groups = groupByGenre(movies).map((group) => ({
    label: group.genre,
    itemIds: group.items.map((item) => item.id),
  }))
  const { placements, overflow } = fillRows(groups, rowSlots(GENRE_RUNS))
  const displays = buildDisplays(items, collections)
  const runs = [...GENRE_RUNS, ...displays.runs]
  return {
    runs,
    sections: [...sectionsFrom(placements), ...displays.sections],
    signs: [...sectionSigns(placements, SIGN_SIZE.section), ...displays.signs],
    gondolas: GONDOLA.xs.map((x, index) => ({ index, x, frontZ: GONDOLA.frontZ, backZ: BACK_Z })),
    colliders: runs.map(runCollider),
    overflow: [...overflow, ...displays.overflow],
  }
}
