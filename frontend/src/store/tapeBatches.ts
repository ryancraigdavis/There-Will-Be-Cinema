import type { AtlasIndex } from '../catalog/types'
import type { AABB } from '../player/collision'
import { groupSlotsByAtlas, isDisplayRun } from './batches'
import type { Slot } from './geometry'
import type { RunKind } from './runs'

export interface BatchSource {
  id: string
  run: { id: string; kind: RunKind }
  slots: readonly Slot[]
}

export interface RunBatch {
  key: string
  runId: string
  atlas: number
  display: boolean
  slots: Slot[]
  bounds: AABB
}

export interface TapeLocation {
  key: string
  instance: number
}

export const batchKey = (runId: string, atlas: number) => `${runId}:${atlas}`

export function slotBounds(slots: readonly Slot[]): AABB {
  const xs = slots.map((slot) => slot.position[0])
  const zs = slots.map((slot) => slot.position[2])
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  }
}

export function runBatches(sections: readonly BatchSource[], index: AtlasIndex | null): RunBatch[] {
  const batches = new Map<string, RunBatch>()
  for (const section of sections) {
    const display = isDisplayRun(section.run.kind)
    for (const { atlas, slots } of groupSlotsByAtlas(section.slots, index, display)) {
      const key = batchKey(section.run.id, atlas)
      const batch = batches.get(key) ?? {
        key,
        runId: section.run.id,
        atlas,
        display,
        slots: [],
        bounds: slotBounds(slots),
      }
      batch.slots.push(...slots)
      batches.set(key, batch)
    }
  }
  return [...batches.values()].map((batch) => ({ ...batch, bounds: slotBounds(batch.slots) }))
}

export function slotLocations(batches: readonly RunBatch[]): Map<Slot, TapeLocation> {
  return new Map(
    batches.flatMap((batch) =>
      batch.slots.map((slot, instance): [Slot, TapeLocation] => [
        slot,
        { key: batch.key, instance },
      ]),
    ),
  )
}

export function distanceToBounds(bounds: AABB, x: number, z: number): number {
  const dx = Math.max(bounds.minX - x, 0, x - bounds.maxX)
  const dz = Math.max(bounds.minZ - z, 0, z - bounds.maxZ)
  return Math.hypot(dx, dz)
}
