import { formatRuntime } from './format'
import type { CatalogItem, HdrFormat } from './types'

export interface Film {
  item: CatalogItem
  versions: CatalogItem[]
}

const HDR_RANK: Record<HdrFormat, number> = {
  'Dolby Vision': 4,
  'HDR10+': 3,
  HDR10: 2,
  HLG: 1,
  SDR: 0,
}

const RESOLUTIONS: [number, string][] = [
  [3000, '4K'],
  [1800, '1080p'],
  [1200, '720p'],
  [0, 'SD'],
]

const GIGABYTE = 1024 ** 3

export function versionKey(item: CatalogItem): string {
  return item.imdb ?? item.tmdb ?? `${item.sortTitle.toLowerCase()}|${item.year ?? ''}`
}

export function hdrRank(hdr: HdrFormat | null): number {
  return HDR_RANK[hdr ?? 'SDR'] ?? 0
}

export function versionScore(item: CatalogItem): number[] {
  return [item.width ?? 0, hdrRank(item.hdr), item.atmos ? 1 : 0, item.fileSize ?? 0]
}

function byScore(a: CatalogItem, b: CatalogItem): number {
  const left = versionScore(a)
  const right = versionScore(b)
  const decided = left.findIndex((value, i) => value !== right[i])
  return decided === -1 ? a.id.localeCompare(b.id) : (right[decided] ?? 0) - (left[decided] ?? 0)
}

export function resolutionLabel(item: CatalogItem): string {
  const width = item.width ?? 0
  return RESOLUTIONS.find(([min]) => width >= min)?.[1] ?? 'SD'
}

export function formatSize(bytes: number | null): string | null {
  return bytes ? `${(bytes / GIGABYTE).toFixed(bytes < 10 * GIGABYTE ? 1 : 0)} GB` : null
}

export function versionLabel(item: CatalogItem, showRuntime = false): string {
  const hdr = item.hdr && item.hdr !== 'SDR' ? item.hdr : null
  const runtime = showRuntime ? formatRuntime(item.runtimeMin) : null
  return [resolutionLabel(item), hdr, runtime].filter(Boolean).join(' · ')
}

export function versionDetail(item: CatalogItem): string {
  return [item.audio, formatSize(item.fileSize)].filter(Boolean).join(' · ')
}

export function runtimesDiffer(versions: readonly CatalogItem[]): boolean {
  const minutes = versions.map((version) => version.runtimeMin ?? 0)
  return new Set(minutes).size > 1
}

export function mergeFilm(versions: readonly CatalogItem[]): CatalogItem {
  const best = versions[0] as CatalogItem
  const top = versions.reduce((a, b) => (hdrRank(a.hdr) >= hdrRank(b.hdr) ? a : b), best)
  return {
    ...best,
    is4k: versions.some((version) => version.is4k),
    hdr: top.hdr,
    dvProfile: top.dvProfile,
    atmos: versions.some((version) => version.atmos),
    dtsx: versions.some((version) => version.dtsx),
    versionCount: versions.length,
  }
}

export function groupFilms(items: readonly CatalogItem[]): Film[] {
  const groups = new Map<string, CatalogItem[]>()
  for (const item of items) {
    const key = versionKey(item)
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }
  return [...groups.values()].map((group) => {
    const versions = [...group].sort(byScore)
    return { item: mergeFilm(versions), versions }
  })
}
