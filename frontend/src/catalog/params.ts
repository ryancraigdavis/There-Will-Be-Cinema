import {
  DEFAULT_FILTERS,
  type Filters,
  FORMAT_OPTIONS,
  type FormatFlag,
  SORT_OPTIONS,
  TYPE_OPTIONS,
} from './filters'

const MIN_YEAR = 1850
const MAX_YEAR = 2100
const YEAR_PATTERN = /^\d{4}$/

function oneOf<T extends string>(value: string | null, allowed: { value: T }[], fallback: T): T {
  return allowed.find((option) => option.value === value)?.value ?? fallback
}

export function toYear(value: string | null): number | null {
  const text = (value ?? '').trim()
  const year = Number(text)
  const valid = YEAR_PATTERN.test(text) && year >= MIN_YEAR && year <= MAX_YEAR
  return valid ? year : null
}

function isFormat(value: string): value is FormatFlag {
  return FORMAT_OPTIONS.some((option) => option.value === value)
}

export function filtersFromParams(params: URLSearchParams): Filters {
  return {
    query: params.get('q') ?? DEFAULT_FILTERS.query,
    type: oneOf(params.get('type'), TYPE_OPTIONS, DEFAULT_FILTERS.type),
    genres: [...new Set(params.getAll('genre'))],
    yearFrom: toYear(params.get('from')),
    yearTo: toYear(params.get('to')),
    formats: [...new Set(params.getAll('fmt').filter(isFormat))],
    sort: oneOf(params.get('sort'), SORT_OPTIONS, DEFAULT_FILTERS.sort),
  }
}

export function paramsFromFilters(filters: Filters): URLSearchParams {
  const entries: [string, string][] = [
    ['q', filters.query],
    ['type', filters.type === DEFAULT_FILTERS.type ? '' : filters.type],
    ...filters.genres.map((genre): [string, string] => ['genre', genre]),
    ['from', filters.yearFrom?.toString() ?? ''],
    ['to', filters.yearTo?.toString() ?? ''],
    ...filters.formats.map((flag): [string, string] => ['fmt', flag]),
    ['sort', filters.sort === DEFAULT_FILTERS.sort ? '' : filters.sort],
  ]
  return new URLSearchParams(entries.filter(([, value]) => value !== ''))
}
