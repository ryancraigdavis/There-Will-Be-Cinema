import type { CatalogItem, ItemType } from './types'

export function formatRuntime(minutes: number | null): string | null {
  const total = minutes ?? 0
  const hours = Math.floor(total / 60)
  const parts = [hours > 0 ? `${hours}h` : '', `${total % 60}m`].filter(Boolean)
  return total > 0 ? parts.join(' ') : null
}

export function formatSeasons(count: number | null): string | null {
  const total = count ?? 0
  return total > 0 ? `${total} season${total === 1 ? '' : 's'}` : null
}

const DETAIL: Record<ItemType, (item: CatalogItem) => string | null> = {
  Movie: (item) => formatRuntime(item.runtimeMin),
  Series: (item) => formatSeasons(item.childCount),
}

export function metaLine(item: CatalogItem): string {
  return [item.year?.toString(), DETAIL[item.type](item)].filter(Boolean).join(' · ')
}

export function formatCount(count: number, noun: string): string {
  return `${count.toLocaleString('en-US')} ${noun}${count === 1 ? '' : 's'}`
}

export function truncate(text: string, limit: number): string {
  const cut = text.slice(0, limit)
  const boundary = cut.lastIndexOf(' ')
  return text.length <= limit ? text : `${cut.slice(0, boundary > 0 ? boundary : limit).trimEnd()}…`
}
