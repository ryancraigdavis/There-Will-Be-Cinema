import type { AABB } from '../player/collision'
import type { Vec3 } from '../scene/math'
import { BOX, DISPLAY_DEPTH, ENDCAP, GONDOLA, ROOM, SHELF, WALL_GAP } from './constants'
import { BACK_Z, END_PANEL, type Sign, type Slot, shelfTop } from './geometry'

export type RunKind = 'genre' | 'new-releases' | 'tv' | 'endcap'
export type XZ = readonly [number, number]

export interface RunSpec {
  id: string
  kind: RunKind
  origin: XZ
  normal: XZ
  length: number
  sections: number
  columns: number
  rows: number
}

const BOX_OUT = SHELF.backing + BOX.spine / 2 + SHELF.inset
const HALF_DIVIDER = GONDOLA.divider / 2
const GONDOLA_LENGTH = GONDOLA.sections * GONDOLA.sectionLength
const WALL_BACK_Z = ROOM.minZ + WALL_GAP
const BACK_SHELF_FRONT_Z = WALL_BACK_Z + DISPLAY_DEPTH
const LEFT_WALL_X = ROOM.minX + WALL_GAP
const RIGHT_WALL_X = ROOM.maxX - WALL_GAP
const LEFT_WALL_START_Z = ROOM.maxZ - 0.6
const NEW_RELEASES_START_Z = 0.9
const RIGHT_WALL_END_Z = NEW_RELEASES_START_Z - 0.4
const TV_HALF = 4
const BACK_SIDE = { inner: 4.1, outer: 6.6 } as const

export function alongOf(normal: XZ): XZ {
  return [normal[1], -normal[0]]
}

export function sectionLength(spec: RunSpec): number {
  return spec.length / spec.sections
}

export function rowCapacity(spec: RunSpec): number {
  return spec.sections * spec.rows
}

export function slotCapacity(spec: RunSpec): number {
  return rowCapacity(spec) * spec.columns
}

export function pointOn(spec: RunSpec, along: number, out: number, y: number): Vec3 {
  const [ax, az] = alongOf(spec.normal)
  return [
    spec.origin[0] + ax * along + spec.normal[0] * out,
    y,
    spec.origin[1] + az * along + spec.normal[1] * out,
  ]
}

export function coverYaw(spec: RunSpec): number {
  return Math.atan2(-spec.normal[1], spec.normal[0])
}

export function signYaw(spec: RunSpec): number {
  return Math.atan2(spec.normal[0], spec.normal[1])
}

export function partYaw(spec: RunSpec): number {
  const [ax, az] = alongOf(spec.normal)
  return Math.atan2(-az, ax)
}

export function slotOn(
  spec: RunSpec,
  section: number,
  shelf: number,
  column: number,
  itemId: string,
): Slot {
  const width = sectionLength(spec)
  const pitch = (width - 2 * SHELF.margin) / spec.columns
  const along = section * width + SHELF.margin + pitch * (column + 0.5)
  return {
    itemId,
    position: pointOn(spec, along, BOX_OUT, shelfTop(shelf) + BOX.height / 2),
    yaw: coverYaw(spec),
  }
}

export function sectionCenter(spec: RunSpec, section: number): Vec3 {
  return pointOn(spec, (section + 0.5) * sectionLength(spec), DISPLAY_DEPTH / 2, 1)
}

export function signOn(
  spec: RunSpec,
  along: number,
  label: string,
  size: number,
  maxWidth: number,
  id: string,
): Sign {
  return {
    id,
    label,
    position: pointOn(spec, along, DISPLAY_DEPTH + 0.006, GONDOLA.signY),
    yaw: signYaw(spec),
    size,
    maxWidth,
  }
}

export function runCollider(spec: RunSpec): AABB {
  const [x0, , z0] = pointOn(spec, 0, 0, 0)
  const [x1, , z1] = pointOn(spec, spec.length, DISPLAY_DEPTH, 0)
  return {
    minX: Math.min(x0, x1),
    maxX: Math.max(x0, x1),
    minZ: Math.min(z0, z1),
    maxZ: Math.max(z0, z1),
  }
}

function sectionsFor(length: number): number {
  return Math.max(1, Math.floor(length + 0.25))
}

function columnsFor(length: number, sections: number): number {
  return Math.max(1, Math.floor((length / sections) * SHELF.columnsPerMeter + 1e-9))
}

function run(
  id: string,
  kind: RunKind,
  origin: XZ,
  normal: XZ,
  length: number,
  rows: number = SHELF.rows,
): RunSpec {
  const sections = sectionsFor(length)
  return { id, kind, origin, normal, length, sections, columns: columnsFor(length, sections), rows }
}

function gondolaFace(gondola: number, side: 1 | -1): RunSpec {
  const x = GONDOLA.xs[gondola] ?? 0
  const originZ = side > 0 ? GONDOLA.frontZ : BACK_Z
  const name = side > 0 ? 'east' : 'west'
  return run(
    `gondola-${gondola}-${name}`,
    'genre',
    [x + side * HALF_DIVIDER, originZ],
    [side, 0],
    GONDOLA_LENGTH,
  )
}

export const GENRE_RUNS: readonly RunSpec[] = [
  gondolaFace(1, 1),
  gondolaFace(2, -1),
  gondolaFace(0, 1),
  gondolaFace(1, -1),
  gondolaFace(2, 1),
  gondolaFace(3, -1),
  gondolaFace(0, -1),
  run(
    'wall-left',
    'genre',
    [LEFT_WALL_X, LEFT_WALL_START_Z],
    [1, 0],
    LEFT_WALL_START_Z - BACK_SHELF_FRONT_Z,
  ),
  run(
    'wall-back-left',
    'genre',
    [-BACK_SIDE.outer, WALL_BACK_Z],
    [0, 1],
    BACK_SIDE.outer - BACK_SIDE.inner,
  ),
  run(
    'wall-back-right',
    'genre',
    [BACK_SIDE.inner, WALL_BACK_Z],
    [0, 1],
    BACK_SIDE.outer - BACK_SIDE.inner,
  ),
  run(
    'wall-right',
    'genre',
    [RIGHT_WALL_X, BACK_SHELF_FRONT_Z],
    [-1, 0],
    RIGHT_WALL_END_Z - BACK_SHELF_FRONT_Z,
  ),
  gondolaFace(3, 1),
]

export const NEW_RELEASES_SPEC: RunSpec = run(
  'new-releases',
  'new-releases',
  [RIGHT_WALL_X, NEW_RELEASES_START_Z],
  [-1, 0],
  4,
)

export const TV_SPEC: RunSpec = run('tv', 'tv', [-TV_HALF, WALL_BACK_Z], [0, 1], TV_HALF * 2)

export function endcapSpecs(): RunSpec[] {
  const half = ENDCAP.width / 2
  const front = GONDOLA.xs.map((x, g) =>
    run(
      `endcap-${g}-front`,
      'endcap',
      [x - half, GONDOLA.frontZ + END_PANEL / 2],
      [0, 1],
      ENDCAP.width,
      ENDCAP.rows,
    ),
  )
  const back = GONDOLA.xs.map((x, g) =>
    run(
      `endcap-${g}-back`,
      'endcap',
      [x + half, BACK_Z - END_PANEL / 2],
      [0, -1],
      ENDCAP.width,
      ENDCAP.rows,
    ),
  )
  return [...front, ...back]
}
