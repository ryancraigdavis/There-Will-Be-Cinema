import { titleCollator } from '../catalog/collate'
import type { CatalogItem, Collection } from '../catalog/types'
import type { AABB } from '../player/collision'
import type { Vec3 } from '../scene/math'
import { GONDOLA, MIN_GENRE_SIZE, OTHER_GENRE, SIGN_SIZE } from './constants'
import { buildDisplays } from './displays'
import { buildDividers, type Divider } from './dividers'
import { baySigns, fillRows, rowSlots, type ShelfSection, sectionsFrom } from './fill'
import { BACK_Z, type Sign } from './geometry'
import { initialOf } from './letters'
import { BANNER, GENRE_RUNS, type RunSpec, runCollider, WALKWAYS } from './runs'

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

export interface Banner {
  id: string
  label: string
  genres: string[]
  position: Vec3
}

export interface DirectoryEntry {
  genre: string
  aisle: string
}

export interface StorePlan {
  runs: RunSpec[]
  banners: Banner[]
  directory: DirectoryEntry[]
  dividers: Divider[]
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

function genresOnRuns(sections: readonly ShelfSection[], runIds: readonly string[]): string[] {
  const named = sections.filter((section) => runIds.includes(section.run.id))
  return [...new Set(named.flatMap((section) => section.labels))]
}

function buildBanners(sections: readonly ShelfSection[]): Banner[] {
  return WALKWAYS.map((walkway) => ({
    id: walkway.id,
    label: walkway.label,
    genres: genresOnRuns(sections, walkway.runIds),
    position: [walkway.x, BANNER.y, BANNER.z] as Vec3,
  })).filter((banner) => banner.genres.length > 0)
}

function buildDirectory(banners: readonly Banner[]): DirectoryEntry[] {
  const seen = new Set<string>()
  const entries = banners.flatMap((banner) =>
    banner.genres.flatMap((genre) => {
      const first = !seen.has(genre)
      seen.add(genre)
      return first ? [{ genre, aisle: banner.label }] : []
    }),
  )
  const otherLast = (entry: DirectoryEntry) => Number(entry.genre === OTHER_GENRE)
  return entries.sort(
    (a, b) => otherLast(a) - otherLast(b) || titleCollator.compare(a.genre, b.genre),
  )
}

export function buildStorePlan(
  items: readonly CatalogItem[],
  collections: readonly Collection[] = [],
): StorePlan {
  const movies = items.filter((item) => item.type === 'Movie')
  const initials = new Map(items.map((item) => [item.id, initialOf(item.sortTitle)]))
  const initialFor = (id: string) => initials.get(id) ?? '#'
  const groups = groupByGenre(movies).map((group) => ({
    label: group.genre,
    itemIds: group.items.map((item) => item.id),
  }))
  const { placements, overflow } = fillRows(groups, rowSlots(GENRE_RUNS), true)
  const displays = buildDisplays(items, collections)
  const genreSections = sectionsFrom(placements)
  const runs = [...GENRE_RUNS, ...displays.runs]
  const banners = buildBanners(genreSections)
  return {
    runs,
    banners,
    directory: buildDirectory(banners),
    dividers: buildDividers(genreSections, initialFor),
    sections: [...genreSections, ...displays.sections],
    signs: [...baySigns(genreSections, SIGN_SIZE.section, initialFor), ...displays.signs],
    gondolas: GONDOLA.xs.map((x, index) => ({ index, x, frontZ: GONDOLA.frontZ, backZ: BACK_Z })),
    colliders: runs.map(runCollider),
    overflow: [...overflow, ...displays.overflow],
  }
}
