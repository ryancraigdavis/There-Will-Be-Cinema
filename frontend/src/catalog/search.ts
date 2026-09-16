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

const MATCH_TIERS: ((title: string, term: string) => boolean)[] = [
  (title, term) => title === term,
  (title, term) => title.startsWith(term),
  (title, term) => title.includes(term),
]

export function matchTier(title: string, term: string): number {
  const tier = MATCH_TIERS.findIndex((test) => test(normalizeTerm(title), term))
  return tier === -1 ? MATCH_TIERS.length : tier
}

export function bestMatches(items: readonly CatalogItem[], query: string): CatalogItem[] {
  const term = normalizeTerm(query.trim())
  return [...items].sort((a, b) => matchTier(a.title, term) - matchTier(b.title, term))
}
