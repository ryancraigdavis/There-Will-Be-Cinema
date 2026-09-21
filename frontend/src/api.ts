import { normalizeGenres, shelfGenre } from './catalog/genres'
import type {
  AtlasIndex,
  Catalog,
  CatalogItem,
  Collection,
  RawCatalog,
  RawCatalogItem,
  RawCollection,
  RawSite,
  SiteInfo,
} from './catalog/types'
import { groupFilms } from './catalog/versions'
import { API_BASE } from './config'

export function toItem(raw: RawCatalogItem): CatalogItem {
  const genres = normalizeGenres(raw.g)
  return {
    id: raw.id,
    type: raw.t,
    title: raw.ti,
    sortTitle: raw.st,
    year: raw.y,
    runtimeMin: raw.rt,
    rating: raw.cr,
    officialRating: raw.or,
    genres,
    primaryGenre: shelfGenre(genres),
    addedAt: raw.dc,
    imageTag: raw.img,
    is4k: raw.k4,
    hdr: raw.hdr,
    dvProfile: raw.dv,
    atmos: raw.at,
    dtsx: raw.dx,
    audio: raw.ac,
    width: raw.w,
    height: raw.h,
    fileSize: raw.sz,
    container: raw.cn,
    videoCodec: raw.vc,
    versionCount: 1,
    childCount: raw.cc,
    overview: raw.ov,
    imdb: raw.imdb,
    tmdb: raw.tmdb,
  }
}

export function toCatalog(raw: RawCatalog): Catalog {
  const films = groupFilms(raw.items.map(toItem))
  const items = films.map((film) => film.item)
  return {
    atlasVersion: raw.atlas,
    items,
    byId: new Map(items.map((item) => [item.id, item])),
    versionsById: new Map(films.map((film) => [film.item.id, film.versions])),
  }
}

export function toSite(raw: RawSite): SiteInfo {
  return { embyUrl: raw.emby_url, embyServerId: raw.emby_server_id }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(`${path} responded ${response.status}`)
  }
  return (await response.json()) as T
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function errorDetail(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  const first = Array.isArray(detail) ? (detail[0] as { msg?: unknown } | undefined)?.msg : detail
  return typeof first === 'string' ? first : `request failed (${status})`
}

export async function sendJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { credentials: 'same-origin', ...init })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, errorDetail(body, response.status))
  }
  return body as T
}

export function postJson<T>(path: string, payload: unknown = {}): Promise<T> {
  return sendJson<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function fetchCatalog(): Promise<Catalog> {
  return toCatalog(await getJson<RawCatalog>('/api/catalog'))
}

export function toCollection(raw: RawCollection): Collection {
  return {
    id: raw.id,
    name: raw.name,
    overview: raw.overview,
    imageTag: raw.img,
    itemIds: raw.items,
  }
}

export async function fetchCollections(): Promise<Collection[]> {
  return (await getJson<RawCollection[]>('/api/collections')).map(toCollection)
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

export async function fetchAtlasIndex(): Promise<AtlasIndex> {
  return getJson<AtlasIndex>('/api/atlases/index.json')
}

export function atlasUrl(index: AtlasIndex, atlas: number, size = index.size): string {
  const suffix = size === index.size ? '' : `-${size}`
  return `${API_BASE}/api/atlases/${atlas}${suffix}.webp?v=${index.version}`
}
