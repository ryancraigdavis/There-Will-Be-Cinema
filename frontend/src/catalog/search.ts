import MiniSearch, { type SearchOptions } from 'minisearch'
import type { CatalogItem } from './types'

const DIACRITICS = /\p{Diacritic}/gu
const DIGITS = /^\d+$/

export type TitleIndex = MiniSearch<CatalogItem>

export function normalizeTerm(term: string): string {
  return term.normalize('NFD').replace(DIACRITICS, '').toLowerCase()
}

const FIELDS: Record<string, (item: CatalogItem) => string> = {
  id: (item) => item.id,
  title: (item) => item.title,
  year: (item) => item.year?.toString() ?? '',
}

const SEARCH_OPTIONS: SearchOptions = {
  boost: { title: 2 },
  combineWith: 'AND',
  prefix: true,
  fuzzy: (term) => (DIGITS.test(term) ? false : 0.2),
}

export function buildIndex(items: CatalogItem[]): TitleIndex {
  const index = new MiniSearch<CatalogItem>({
    fields: ['title', 'year'],
    extractField: (item, field) => FIELDS[field]?.(item) ?? '',
    processTerm: normalizeTerm,
    searchOptions: SEARCH_OPTIONS,
  })
  index.addAll(items)
  return index
}

export function rankIds(index: TitleIndex, query: string): string[] | null {
  const trimmed = query.trim()
  return trimmed === '' ? null : index.search(trimmed).map((hit) => String(hit.id))
}
