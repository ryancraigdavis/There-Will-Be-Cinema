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
  w: number | null
  h: number | null
  sz: number | null
  cn: string | null
  vc: string | null
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
  width: number | null
  height: number | null
  fileSize: number | null
  container: string | null
  videoCodec: string | null
  versionCount: number
  childCount: number | null
  overview: string | null
  imdb: string | null
  tmdb: string | null
}

export interface Catalog {
  atlasVersion: string
  items: CatalogItem[]
  byId: Map<string, CatalogItem>
  versionsById: Map<string, CatalogItem[]>
}

export interface RawCollection {
  id: string
  name: string
  overview: string | null
  img: string | null
  items: string[]
}

export interface Collection {
  id: string
  name: string
  overview: string | null
  imageTag: string | null
  itemIds: string[]
}

export interface SiteInfo {
  embyUrl: string
  embyServerId: string | null
  clubUrl: string
}

export interface AtlasIndex {
  cell: [number, number]
  size: number
  cols: number
  rows: number
  version: string
  count: number
  levels?: number[]
  slots: Record<string, [number, number, number]>
}
