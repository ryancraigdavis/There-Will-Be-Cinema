import { toCatalog } from '../api'
import type { Catalog, CatalogItem, RawCatalogItem } from '../catalog/types'

export function rawItem(overrides: Partial<RawCatalogItem> = {}): RawCatalogItem {
  return {
    id: 'id',
    t: 'Movie',
    ti: 'Title',
    st: 'title',
    y: 2000,
    rt: 100,
    cr: 7,
    or: 'R',
    pg: 'Drama',
    dc: '2025-01-01T00:00:00Z',
    img: 'tag',
    k4: false,
    hdr: 'SDR',
    dv: null,
    at: false,
    dx: false,
    ac: 'AAC stereo',
    w: 1920,
    h: 1080,
    sz: 8589934592,
    cn: 'mkv',
    vc: 'h264',
    cc: null,
    ov: 'Overview',
    g: ['Drama'],
    tg: [],
    imdb: null,
    tmdb: null,
    ...overrides,
  }
}

export const RAW_ITEMS: RawCatalogItem[] = [
  rawItem({
    id: 'twbb',
    ti: 'There Will Be Blood',
    st: 'there will be blood',
    y: 2007,
    g: ['Drama', 'History'],
    k4: true,
    hdr: 'Dolby Vision',
    dv: '7.6',
    at: true,
    cr: 8.2,
    dc: '2025-03-01T00:00:00Z',
  }),
  rawItem({
    id: 'alien',
    ti: 'Alien',
    st: 'alien',
    y: 1979,
    g: ['Horror', 'Science Fiction'],
    hdr: 'HDR10',
    k4: true,
    cr: 8.5,
    dc: '2025-01-05T00:00:00Z',
  }),
  rawItem({
    id: 'aliens',
    ti: 'Aliens',
    st: 'aliens',
    y: 1986,
    g: ['Action', 'Science Fiction'],
    cr: 8.4,
    dc: '2025-02-01T00:00:00Z',
  }),
  rawItem({
    id: 'amelie',
    ti: 'Amélie',
    st: 'amelie',
    y: 2001,
    g: ['Comedy', 'Romance'],
    cr: 8.3,
    dc: '2024-12-01T00:00:00Z',
  }),
  rawItem({
    id: 'term',
    ti: 'The Terminator',
    st: 'terminator',
    y: 1984,
    g: ['Action', 'Science Fiction'],
    cr: 8.1,
    dc: '2025-01-10T00:00:00Z',
  }),
  rawItem({
    id: 'peaks',
    t: 'Series',
    ti: 'Twin Peaks',
    st: 'twin peaks',
    y: 1990,
    rt: null,
    cc: 3,
    g: ['Mystery', 'Drama'],
    cr: null,
    dc: '2025-04-01T00:00:00Z',
  }),
  rawItem({
    id: 'noyear',
    ti: 'Undated',
    st: 'undated',
    y: null,
    g: [],
    img: null,
    cr: null,
    dc: null,
  }),
]

export function catalogFixture(): Catalog {
  return toCatalog({ atlas: 'v1', items: RAW_ITEMS })
}

export function item(id: string): CatalogItem {
  const found = catalogFixture().byId.get(id)
  if (!found) {
    throw new Error(`fixture ${id} missing`)
  }
  return found
}
