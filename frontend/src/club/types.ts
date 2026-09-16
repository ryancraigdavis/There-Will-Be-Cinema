import { API_BASE } from '../config'

export type ScreeningStatus = 'draft' | 'published' | 'cancelled'

export interface RawScreening {
  id: number
  title: string
  year: number | null
  starts_at: string
  location: string | null
  message: string | null
  description: string | null
  item_id: string | null
  poster_url: string | null
  runtime_min: number | null
}

export interface RawAdminScreening extends RawScreening {
  status: ScreeningStatus
  art_url: string | null
  updated_at: string
}

export interface Screening {
  id: number
  title: string
  year: number | null
  startsAt: string
  location: string | null
  message: string | null
  description: string | null
  itemId: string | null
  posterUrl: string | null
  runtimeMin: number | null
}

export interface AdminScreening extends Screening {
  status: ScreeningStatus
  artUrl: string | null
  updatedAt: string
}

export function toScreening(raw: RawScreening): Screening {
  return {
    id: raw.id,
    title: raw.title,
    year: raw.year,
    startsAt: raw.starts_at,
    location: raw.location,
    message: raw.message,
    description: raw.description,
    itemId: raw.item_id,
    posterUrl: raw.poster_url === null ? null : `${API_BASE}${raw.poster_url}`,
    runtimeMin: raw.runtime_min,
  }
}

export function toAdminScreening(raw: RawAdminScreening): AdminScreening {
  return {
    ...toScreening(raw),
    status: raw.status,
    artUrl: raw.art_url,
    updatedAt: raw.updated_at,
  }
}
