import type { Vec3 } from '../scene/math'
import type { Sign, Slot } from './geometry'
import { letterRange } from './letters'
import { type RunSpec, sectionCenter, sectionLength, signOn, slotOn } from './runs'

export interface RowSlot {
  run: RunSpec
  section: number
  shelf: number
}

export interface ShelfGroupInput {
  label: string
  itemIds: readonly string[]
}

export interface Placement extends RowSlot {
  label: string
  itemIds: string[]
  starts: boolean
}

export interface ShelfSection {
  id: string
  run: RunSpec
  index: number
  labels: string[]
  slots: Slot[]
  center: Vec3
}

const range = (count: number) => Array.from({ length: count }, (_, i) => i)

export function rowSlots(runs: readonly RunSpec[]): RowSlot[] {
  return runs.flatMap((run) =>
    range(run.sections).flatMap((section) =>
      range(run.rows).map((shelf) => ({ run, section, shelf })),
    ),
  )
}

function nextBay(rows: readonly RowSlot[], cursor: number): number {
  let next = cursor
  while (next < rows.length && rows[next]?.shelf !== 0) {
    next += 1
  }
  return next
}

export function fillRows(
  groups: readonly ShelfGroupInput[],
  rows: readonly RowSlot[],
  bayAligned = false,
): { placements: Placement[]; overflow: string[] } {
  const placements: Placement[] = []
  const overflow: string[] = []
  let cursor = 0
  for (const group of groups) {
    cursor = bayAligned ? nextBay(rows, cursor) : cursor
    let remaining = [...group.itemIds]
    let starts = true
    while (remaining.length > 0 && cursor < rows.length) {
      const row = rows[cursor] as RowSlot
      placements.push({
        ...row,
        label: group.label,
        itemIds: remaining.slice(0, row.run.columns),
        starts,
      })
      remaining = remaining.slice(row.run.columns)
      starts = false
      cursor += 1
    }
    overflow.push(...remaining)
  }
  return { placements, overflow }
}

const sectionId = (placement: RowSlot) => `${placement.run.id}:${placement.section}`

export function sectionsFrom(placements: readonly Placement[]): ShelfSection[] {
  const sections = new Map<string, ShelfSection>()
  for (const placement of placements) {
    const id = sectionId(placement)
    const entry = sections.get(id) ?? {
      id,
      run: placement.run,
      index: placement.section,
      labels: [],
      slots: [],
      center: sectionCenter(placement.run, placement.section),
    }
    const slots = placement.itemIds.map((itemId, column) =>
      slotOn(placement.run, placement.section, placement.shelf, column, itemId),
    )
    const labels = entry.labels.includes(placement.label)
      ? entry.labels
      : [...entry.labels, placement.label]
    sections.set(id, { ...entry, labels, slots: [...entry.slots, ...slots] })
  }
  return [...sections.values()]
}

export function baySigns(
  sections: readonly ShelfSection[],
  size: number,
  initialOf: (itemId: string) => string,
): Sign[] {
  return sections.map((section) => {
    const width = sectionLength(section.run)
    const initials = section.slots.map((slot) => initialOf(slot.itemId))
    const label = [section.labels.join(' · '), letterRange(initials)].filter(Boolean).join(' ')
    return signOn(
      section.run,
      (section.index + 0.5) * width,
      label,
      size,
      width * 0.92,
      `sign:${section.id}`,
    )
  })
}

export function runSign(run: RunSpec, label: string, size: number): Sign {
  return signOn(run, run.length / 2, label, size, run.length * 0.92, `sign:${run.id}`)
}
