export type ItemType = 'Movie' | 'Series'

export type HdrFormat = 'SDR' | 'HDR10' | 'HDR10+' | 'HLG' | 'Dolby Vision'

export interface RawCatalogItem {
  id: string
  t: ItemType
  ti: string
  st: string
  y: number | null
  rt: number | null
  cr: number | null
  or: string | null
  pg: string
  dc: string | null
  img: string | null
  k4: boolean
  hdr: HdrFormat | null
  dv: string | null
  at: boolean
  dx: boolean
  ac: string | null
  cc: number | null
  ov: string | null
  g: string[]
  tg: string[]
  imdb: string | null
  tmdb: string | null
}

export interface RawCatalog {
  atlas: string
  items: RawCatalogItem[]
}

export interface RawSite {
  emby_url: string
  emby_server_id: string | null
  club_url: string
}

export interface CatalogItem {
  id: string
  type: ItemType
  title: string
  sortTitle: string
  year: number | null
  runtimeMin: number | null
  rating: number | null
  officialRating: string | null
  genres: string[]
  primaryGenre: string
  addedAt: string | null
  imageTag: string | null
  is4k: boolean
  hdr: HdrFormat | null
  dvProfile: string | null
  atmos: boolean
  dtsx: boolean
  audio: string | null
  childCount: number | null
  overview: string | null
  imdb: string | null
  tmdb: string | null
}

export interface Catalog {
  atlasVersion: string
  items: CatalogItem[]
  byId: Map<string, CatalogItem>
}

export interface SiteInfo {
  embyUrl: string
  embyServerId: string | null
  clubUrl: string
}
