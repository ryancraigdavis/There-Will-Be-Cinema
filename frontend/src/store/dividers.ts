import type { Vec3 } from '../scene/math'
import { BOX } from './constants'
import type { ShelfSection } from './fill'

export interface Divider {
  id: string
  letter: string
  position: Vec3
  yaw: number
}

export const DIVIDER = { width: 0.058, height: 0.07, overlap: 0.015 } as const

function riseAbove(y: number): number {
  return y + BOX.height / 2 + DIVIDER.height / 2 - DIVIDER.overlap
}

function tabFor(
  section: ShelfSection,
  index: number,
  initialOf: (itemId: string) => string,
): Divider[] {
  const slot = section.slots[index]
  const before = section.slots[index - 1]
  if (!slot) {
    return []
  }
  const letter = initialOf(slot.itemId)
  const changed = before
    ? initialOf(before.itemId) !== letter && before.position[1] === slot.position[1]
    : true
  return changed
    ? [
        {
          id: `${section.id}:${index}`,
          letter,
          position: [slot.position[0], riseAbove(slot.position[1]), slot.position[2]],
          yaw: slot.yaw,
        },
      ]
    : []
}

export function buildDividers(
  sections: readonly ShelfSection[],
  initialOf: (itemId: string) => string,
): Divider[] {
  return sections.flatMap((section) =>
    section.slots.flatMap((_slot, index) => tabFor(section, index, initialOf)),
  )
}
