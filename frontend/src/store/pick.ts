import type { AtlasIndex } from '../catalog/types'
import type { Vec3 } from '../scene/math'
import { groupSlotsByAtlas } from './batches'
import { BOX } from './constants'
import type { Slot } from './geometry'

export interface Box3 {
  min: Vec3
  max: Vec3
}

export interface PickSlot extends Box3 {
  key: string
  instance: number
  itemId: string
}

export interface PickSection extends Box3 {
  slots: PickSlot[]
}

export interface PickHit {
  slot: PickSlot
  distance: number
}

export interface TapeLocation {
  key: string
  instance: number
}

export const batchKey = (sectionId: string, atlas: number) => `${sectionId}:${atlas}`

export function slotBounds(slot: Slot): Box3 {
  const c = Math.abs(Math.cos(slot.yaw))
  const s = Math.abs(Math.sin(slot.yaw))
  const hx = (c * BOX.spine + s * BOX.cover) / 2
  const hz = (s * BOX.spine + c * BOX.cover) / 2
  const [x, y, z] = slot.position
  return { min: [x - hx, y - BOX.height / 2, z - hz], max: [x + hx, y + BOX.height / 2, z + hz] }
}

function union(boxes: readonly Box3[]): Box3 {
  const axis = (pick: (box: Box3) => Vec3, reduce: (...n: number[]) => number) =>
    [0, 1, 2].map((i) => reduce(...boxes.map((box) => pick(box)[i]))) as unknown as Vec3
  return { min: axis((box) => box.min, Math.min), max: axis((box) => box.max, Math.max) }
}

export function buildPickIndex(
  sections: readonly { id: string; slots: readonly Slot[] }[],
  index: AtlasIndex | null,
): PickSection[] {
  return sections
    .map((section) => {
      const slots = groupSlotsByAtlas(section.slots, index).flatMap((batch) =>
        batch.slots.map((slot, instance) => ({
          ...slotBounds(slot),
          key: batchKey(section.id, batch.atlas),
          instance,
          itemId: slot.itemId,
        })),
      )
      return { ...union(slots), slots }
    })
    .filter((section) => section.slots.length > 0)
}

export function tapeLocations(sections: readonly PickSection[]): Map<string, TapeLocation[]> {
  const locations = new Map<string, TapeLocation[]>()
  for (const { key, instance, itemId } of sections.flatMap((section) => section.slots)) {
    locations.set(itemId, [...(locations.get(itemId) ?? []), { key, instance }])
  }
  return locations
}

export function rayBox(origin: Vec3, direction: Vec3, box: Box3): number | null {
  let near = 0
  let far = Number.POSITIVE_INFINITY
  for (const axis of [0, 1, 2] as const) {
    const inverse = 1 / direction[axis]
    const t1 = (box.min[axis] - origin[axis]) * inverse
    const t2 = (box.max[axis] - origin[axis]) * inverse
    near = Math.max(near, Math.min(t1, t2))
    far = Math.min(far, Math.max(t1, t2))
  }
  return near <= far ? near : null
}

function closer(a: PickHit | null, b: PickHit | null): PickHit | null {
  return a === null || (b !== null && b.distance < a.distance) ? b : a
}

function slotHit(slot: PickSlot, origin: Vec3, direction: Vec3, far: number): PickHit | null {
  const distance = rayBox(origin, direction, slot)
  return distance !== null && distance <= far ? { slot, distance } : null
}

function sectionHit(
  section: PickSection,
  origin: Vec3,
  direction: Vec3,
  far: number,
  hidden: string | null,
): PickHit | null {
  return section.slots
    .filter((slot) => slot.itemId !== hidden)
    .reduce<PickHit | null>(
      (best, slot) => closer(best, slotHit(slot, origin, direction, far)),
      null,
    )
}

export function pickTape(
  origin: Vec3,
  direction: Vec3,
  far: number,
  sections: readonly PickSection[],
  hidden: string | null = null,
): PickHit | null {
  return sections.reduce<PickHit | null>((best, section) => {
    const entry = rayBox(origin, direction, section)
    const worth = entry !== null && entry <= Math.min(far, best?.distance ?? far)
    return worth ? closer(best, sectionHit(section, origin, direction, far, hidden)) : best
  }, null)
}
