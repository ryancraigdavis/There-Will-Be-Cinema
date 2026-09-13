import { titleCollator } from '../catalog/collate'
import type { CatalogItem } from '../catalog/types'
import type { AABB } from '../player/collision'
import type { Vec3 } from '../scene/math'
import { BOX, GONDOLA, MIN_GENRE_SIZE, OTHER_GENRE, SHELF } from './constants'

export interface Slot {
  itemId: string
  position: Vec3
  yaw: number
}

export interface SectionSign {
  label: string
  position: Vec3
  yaw: number
}

export interface Section {
  id: string
  aisle: number
  face: number
  index: number
  genres: string[]
  slots: Slot[]
  sign: SectionSign
}

export interface GondolaFrame {
  index: number
  x: number
  frontZ: number
  backZ: number
}

export interface GenreGroup {
  genre: string
  items: CatalogItem[]
}

export interface ShelfRow {
  genre: string
  itemIds: string[]
}

export interface FaceSpec {
  aisle: number
  gondola: number
  side: 1 | -1
}

export interface StorePlan {
  sections: Section[]
  gondolas: GondolaFrame[]
  colliders: AABB[]
  overflow: string[]
}

export const FACES: readonly FaceSpec[] = [
  { aisle: 0, gondola: 1, side: 1 },
  { aisle: 0, gondola: 2, side: -1 },
  { aisle: 1, gondola: 0, side: 1 },
  { aisle: 1, gondola: 1, side: -1 },
  { aisle: 2, gondola: 2, side: 1 },
  { aisle: 2, gondola: 3, side: -1 },
  { aisle: 3, gondola: 0, side: -1 },
  { aisle: 4, gondola: 3, side: 1 },
]

export const ROWS_PER_FACE = GONDOLA.sections * SHELF.rows
export const BACK_Z = GONDOLA.frontZ - GONDOLA.sections * GONDOLA.sectionLength
export const FACE_OFFSET = GONDOLA.divider / 2 + SHELF.depth

function countBy<T>(values: readonly T[], key: (value: T) => string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) {
    counts.set(key(value), (counts.get(key(value)) ?? 0) + 1)
  }
  return counts
}

function byTitle(a: CatalogItem, b: CatalogItem): number {
  return titleCollator.compare(a.sortTitle, b.sortTitle) || a.id.localeCompare(b.id)
}

function byShelfOrder(a: GenreGroup, b: GenreGroup): number {
  const otherLast = Number(a.genre === OTHER_GENRE) - Number(b.genre === OTHER_GENRE)
  return otherLast || b.items.length - a.items.length || titleCollator.compare(a.genre, b.genre)
}

export function groupByGenre(
  items: readonly CatalogItem[],
  minSize = MIN_GENRE_SIZE,
): GenreGroup[] {
  const counts = countBy(items, (item) => item.primaryGenre)
  const buckets = new Map<string, CatalogItem[]>()
  for (const item of items) {
    const genre = (counts.get(item.primaryGenre) ?? 0) >= minSize ? item.primaryGenre : OTHER_GENRE
    const bucket = buckets.get(genre) ?? []
    bucket.push(item)
    buckets.set(genre, bucket)
  }
  return [...buckets]
    .map(([genre, grouped]) => ({ genre, items: grouped.sort(byTitle) }))
    .sort(byShelfOrder)
}

function chunk<T>(values: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, i) =>
    values.slice(i * size, (i + 1) * size),
  )
}

export function toRows(groups: readonly GenreGroup[]): ShelfRow[] {
  return groups.flatMap((group) =>
    chunk(group.items, SHELF.slots).map((items) => ({
      genre: group.genre,
      itemIds: items.map((item) => item.id),
    })),
  )
}

export function addressOf(row: number): { face: number; section: number; shelf: number } {
  const withinFace = row % ROWS_PER_FACE
  return {
    face: Math.floor(row / ROWS_PER_FACE),
    section: Math.floor(withinFace / SHELF.rows),
    shelf: withinFace % SHELF.rows,
  }
}

function faceGeometry(spec: FaceSpec) {
  return {
    x: GONDOLA.xs[spec.gondola] ?? 0,
    startZ: spec.side > 0 ? GONDOLA.frontZ : BACK_Z,
    dir: -spec.side,
    yaw: (spec.side * Math.PI) / 2,
  }
}

export function shelfTop(shelf: number): number {
  return SHELF.topY - shelf * SHELF.rowGap
}

export function slotPosition(spec: FaceSpec, section: number, shelf: number, index: number): Vec3 {
  const face = faceGeometry(spec)
  const along =
    section * GONDOLA.sectionLength + SHELF.margin + SHELF.pitch / 2 + index * SHELF.pitch
  return [
    face.x + spec.side * (FACE_OFFSET - SHELF.inset - BOX.cover / 2),
    shelfTop(shelf) + BOX.height / 2,
    face.startZ + face.dir * along,
  ]
}

function signFor(spec: FaceSpec, section: number, genres: readonly string[]): SectionSign {
  const face = faceGeometry(spec)
  return {
    label: genres.join(' · '),
    position: [
      face.x + spec.side * (FACE_OFFSET + 0.006),
      GONDOLA.signY,
      face.startZ + face.dir * (section + 0.5) * GONDOLA.sectionLength,
    ],
    yaw: face.yaw,
  }
}

function buildSections(rows: readonly ShelfRow[]): Section[] {
  const sections = new Map<string, Section>()
  rows.forEach((row, rowIndex) => {
    const { face, section, shelf } = addressOf(rowIndex)
    const spec = FACES[face] as FaceSpec
    const id = `${face}-${section}`
    const entry: Section = sections.get(id) ?? {
      id,
      aisle: spec.aisle,
      face,
      index: section,
      genres: [],
      slots: [],
      sign: signFor(spec, section, []),
    }
    const genres = entry.genres.includes(row.genre) ? entry.genres : [...entry.genres, row.genre]
    const yaw = faceGeometry(spec).yaw
    const slots = row.itemIds.map((itemId, i) => ({
      itemId,
      position: slotPosition(spec, section, shelf, i),
      yaw,
    }))
    sections.set(id, {
      ...entry,
      genres,
      slots: [...entry.slots, ...slots],
      sign: signFor(spec, section, genres),
    })
  })
  return [...sections.values()]
}

export function gondolaCollider(x: number): AABB {
  return { minX: x - FACE_OFFSET, maxX: x + FACE_OFFSET, minZ: BACK_Z, maxZ: GONDOLA.frontZ }
}

export function buildStorePlan(items: readonly CatalogItem[]): StorePlan {
  const rows = toRows(groupByGenre(items.filter((item) => item.type === 'Movie')))
  const capacity = FACES.length * ROWS_PER_FACE
  return {
    sections: buildSections(rows.slice(0, capacity)),
    gondolas: GONDOLA.xs.map((x, index) => ({ index, x, frontZ: GONDOLA.frontZ, backZ: BACK_Z })),
    colliders: GONDOLA.xs.map(gondolaCollider),
    overflow: rows.slice(capacity).flatMap((row) => row.itemIds),
  }
}
