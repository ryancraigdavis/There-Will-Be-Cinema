import { titleCollator } from './collate'
import type { Catalog, CatalogItem } from './types'

export type TypeFilter = 'all' | 'Movie' | 'Series'
export type FormatFlag = '4k' | 'hdr' | 'dv' | 'atmos'
export type SortKey = 'relevance' | 'title' | 'year-desc' | 'year-asc' | 'added' | 'rating'

export interface Filters {
  query: string
  type: TypeFilter
  genres: string[]
  yearFrom: number | null
  yearTo: number | null
  formats: FormatFlag[]
  sort: SortKey
}

export const DEFAULT_FILTERS: Filters = {
  query: '',
  type: 'all',
  genres: [],
  yearFrom: null,
  yearTo: null,
  formats: [],
  sort: 'relevance',
}

export const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Movie', label: 'Movies' },
  { value: 'Series', label: 'TV' },
]

export const FORMAT_OPTIONS: { value: FormatFlag; label: string }[] = [
  { value: '4k', label: '4K' },
  { value: 'hdr', label: 'HDR' },
  { value: 'dv', label: 'Dolby Vision' },
  { value: 'atmos', label: 'Atmos' },
]

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Best match' },
  { value: 'title', label: 'Title A–Z' },
  { value: 'year-desc', label: 'Newest first' },
  { value: 'year-asc', label: 'Oldest first' },
  { value: 'added', label: 'Recently added' },
  { value: 'rating', label: 'Highest rated' },
]

type Predicate = (item: CatalogItem) => boolean
type Comparator = (a: CatalogItem, b: CatalogItem) => number

const FORMAT_TESTS: Record<FormatFlag, Predicate> = {
  '4k': (item) => item.is4k,
  hdr: (item) => item.hdr !== null && item.hdr !== 'SDR',
  dv: (item) => item.hdr === 'Dolby Vision',
  atmos: (item) => item.atmos,
}

function predicates(filters: Filters): Predicate[] {
  const { type, genres, yearFrom, yearTo, formats } = filters
  return [
    (item) => type === 'all' || item.type === type,
    (item) => genres.every((genre) => item.genres.includes(genre)),
    (item) => yearFrom === null || (item.year ?? Number.NEGATIVE_INFINITY) >= yearFrom,
    (item) => yearTo === null || (item.year ?? Number.POSITIVE_INFINITY) <= yearTo,
    (item) => formats.every((flag) => FORMAT_TESTS[flag](item)),
  ]
}

export function applyFilters(items: CatalogItem[], filters: Filters): CatalogItem[] {
  const tests = predicates(filters)
  return items.filter((item) => tests.every((test) => test(item)))
}

const collator = titleCollator
const byTitle: Comparator = (a, b) => collator.compare(a.sortTitle, b.sortTitle)

const COMPARATORS: Record<Exclude<SortKey, 'relevance'>, Comparator> = {
  title: byTitle,
  'year-desc': (a, b) => (b.year ?? 0) - (a.year ?? 0) || byTitle(a, b),
  'year-asc': (a, b) => (a.year ?? 9999) - (b.year ?? 9999) || byTitle(a, b),
  added: (a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? '') || byTitle(a, b),
  rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || byTitle(a, b),
}

const SORTERS: Record<SortKey, (items: CatalogItem[]) => CatalogItem[]> = {
  relevance: (items) => items,
  ...Object.fromEntries(
    Object.entries(COMPARATORS).map(([key, compare]) => [
      key,
      (items: CatalogItem[]) => [...items].sort(compare),
    ]),
  ),
} as Record<SortKey, (items: CatalogItem[]) => CatalogItem[]>

export function effectiveSort(sort: SortKey, ranked: string[] | null): SortKey {
  return sort === 'relevance' && ranked === null ? 'title' : sort
}

function rankedPool(catalog: Catalog, ranked: string[]): CatalogItem[] {
  return ranked.flatMap((id) => catalog.byId.get(id) ?? [])
}

export function selectResults(
  catalog: Catalog,
  ranked: string[] | null,
  filters: Filters,
): CatalogItem[] {
  const pool = ranked === null ? catalog.items : rankedPool(catalog, ranked)
  return SORTERS[effectiveSort(filters.sort, ranked)](applyFilters(pool, filters))
}

export function genreCounts(items: CatalogItem[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const genre of items.flatMap((item) => item.genres)) {
    counts.set(genre, (counts.get(genre) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0]))
}

export function yearBounds(items: CatalogItem[]): [number, number] {
  const years = items.flatMap((item) => item.year ?? [])
  return [Math.min(...years), Math.max(...years)]
}

export function activeFilterCount(filters: Filters): number {
  return (
    [
      filters.query.trim() !== '',
      filters.type !== 'all',
      filters.yearFrom !== null,
      filters.yearTo !== null,
    ].filter(Boolean).length +
    filters.genres.length +
    filters.formats.length
  )
}

export function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
}
