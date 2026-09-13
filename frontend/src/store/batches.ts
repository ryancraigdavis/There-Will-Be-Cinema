import type { AtlasIndex } from '../catalog/types'
import type { Slot } from './layout'

export interface SlotBatch {
  atlas: number
  slots: Slot[]
}

export const NO_ATLAS = -1

export function atlasOf(itemId: string, index: AtlasIndex | null): number {
  return index?.slots[itemId]?.[0] ?? NO_ATLAS
}

export function groupSlotsByAtlas(slots: readonly Slot[], index: AtlasIndex | null): SlotBatch[] {
  const batches = new Map<number, Slot[]>()
  for (const slot of slots) {
    const atlas = atlasOf(slot.itemId, index)
    const batch = batches.get(atlas) ?? []
    batch.push(slot)
    batches.set(atlas, batch)
  }
  return [...batches]
    .map(([atlas, grouped]) => ({ atlas, slots: grouped }))
    .sort((a, b) => a.atlas - b.atlas)
}

export function cellSize(index: AtlasIndex | null): [number, number] {
  return index ? [index.cell[0] / index.size, index.cell[1] / index.size] : [0, 0]
}

export function cellOrigin(itemId: string, index: AtlasIndex | null): [number, number, number] {
  const slot = index?.slots[itemId]
  const [du, dv] = cellSize(index)
  return slot ? [slot[1] * du, 1 - (slot[2] + 1) * dv, 1] : [0, 0, 0]
}
