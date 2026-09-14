const ALIASES: Record<string, string> = {
  'Sci-Fi': 'Science Fiction',
  'Sci-Fi & Fantasy': 'Science Fiction',
  'Science-Fiction': 'Science Fiction',
  Suspense: 'Thriller',
  Children: 'Family',
  Kids: 'Family',
  Musical: 'Music',
  'Action & Adventure': 'Action',
  'War & Politics': 'War',
}

const FORMAT_GENRES: ReadonlySet<string> = new Set([
  'TV Movie',
  'Mini-Series',
  'Short',
  'Reality',
  'Talk Show',
  'Game Show',
  'Exercise',
  'Travel',
  'News',
  'Soap',
])

export const UNCATEGORIZED = 'Uncategorized'

export function normalizeGenres(genres: readonly string[]): string[] {
  return [...new Set(genres.map((genre) => ALIASES[genre.trim()] ?? genre.trim()))]
}

export function shelfGenre(genres: readonly string[]): string {
  return genres.find((genre) => !FORMAT_GENRES.has(genre)) ?? genres[0] ?? UNCATEGORIZED
}
