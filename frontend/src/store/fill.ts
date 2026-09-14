import type { Vec3 } from '../scene/math'
import type { Sign, Slot } from './geometry'
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

export function fillRows(
  groups: readonly ShelfGroupInput[],
  rows: readonly RowSlot[],
): { placements: Placement[]; overflow: string[] } {
  const placements: Placement[] = []
  const overflow: string[] = []
  let cursor = 0
  for (const group of groups) {
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

const headsSection = (placement: Placement) =>
  placement.starts || (placement.section === 0 && placement.shelf === 0)

export function sectionSigns(placements: readonly Placement[], size: number): Sign[] {
  const heads = new Map<string, { placement: Placement; labels: string[] }>()
  for (const placement of placements.filter(headsSection)) {
    const id = sectionId(placement)
    const entry = heads.get(id) ?? { placement, labels: [] }
    const labels = entry.labels.includes(placement.label)
      ? entry.labels
      : [...entry.labels, placement.label]
    heads.set(id, { ...entry, labels })
  }
  return [...heads].map(([id, { placement, labels }]) => {
    const width = sectionLength(placement.run)
    return signOn(
      placement.run,
      (placement.section + 0.5) * width,
      labels.join(' · '),
      size,
      width * 0.92,
      `sign:${id}`,
    )
  })
}

export function runSign(run: RunSpec, label: string, size: number): Sign {
  return signOn(run, run.length / 2, label, size, run.length * 0.92, `sign:${run.id}`)
}
