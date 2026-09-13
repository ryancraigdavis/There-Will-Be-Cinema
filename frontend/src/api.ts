import type {
  Catalog,
  CatalogItem,
  RawCatalog,
  RawCatalogItem,
  RawSite,
  SiteInfo,
} from './catalog/types'
import { API_BASE } from './config'

export function toItem(raw: RawCatalogItem): CatalogItem {
  return {
    id: raw.id,
    type: raw.t,
    title: raw.ti,
    sortTitle: raw.st,
    year: raw.y,
    runtimeMin: raw.rt,
    rating: raw.cr,
    officialRating: raw.or,
    genres: raw.g,
    primaryGenre: raw.pg,
    addedAt: raw.dc,
    imageTag: raw.img,
    is4k: raw.k4,
    hdr: raw.hdr,
    dvProfile: raw.dv,
    atmos: raw.at,
    dtsx: raw.dx,
    audio: raw.ac,
    childCount: raw.cc,
    overview: raw.ov,
    imdb: raw.imdb,
    tmdb: raw.tmdb,
  }
}

export function toCatalog(raw: RawCatalog): Catalog {
  const items = raw.items.map(toItem)
  return { atlasVersion: raw.atlas, items, byId: new Map(items.map((item) => [item.id, item])) }
}

export function toSite(raw: RawSite): SiteInfo {
  return { embyUrl: raw.emby_url, embyServerId: raw.emby_server_id, clubUrl: raw.club_url }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(`${path} responded ${response.status}`)
  }
  return (await response.json()) as T
}

export async function fetchCatalog(): Promise<Catalog> {
  return toCatalog(await getJson<RawCatalog>('/api/catalog'))
}

export async function fetchSite(): Promise<SiteInfo> {
  return toSite(await getJson<RawSite>('/api/site'))
}

export function posterUrl(item: Pick<CatalogItem, 'id' | 'imageTag'>): string {
  return `${API_BASE}/api/posters/${encodeURIComponent(item.id)}.webp?v=${item.imageTag ?? ''}`
}

export function embyHomeUrl(site: SiteInfo): string {
  return `${site.embyUrl}/web/index.html`
}

export function embyItemUrl(site: SiteInfo, itemId: string): string {
  const server = site.embyServerId ? `&serverId=${encodeURIComponent(site.embyServerId)}` : ''
  return `${embyHomeUrl(site)}#!/item?id=${encodeURIComponent(itemId)}${server}`
}
