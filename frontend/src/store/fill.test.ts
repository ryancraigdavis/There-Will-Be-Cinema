import { describe, expect, it } from 'vitest'
import { baySigns, fillRows, rowSlots, sectionsFrom } from './fill'
import type { RunSpec } from './runs'

const run = (id: string, columns: number, rows: number, sections = 1): RunSpec => ({
  id,
  kind: 'genre',
  origin: [0, 0],
  normal: [0, 1],
  length: sections,
  sections,
  columns,
  rows,
})

const ids = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => `${prefix}${i}`)

describe('fillRows', () => {
  it('starts every group on a fresh row and reports what does not fit', () => {
    const rows = rowSlots([run('r', 3, 2)])
    const { placements, overflow } = fillRows(
      [
        { label: 'A', itemIds: ids('a', 4) },
        { label: 'B', itemIds: ids('b', 2) },
      ],
      rows,
    )
    expect(placements.map((p) => [p.label, p.itemIds.length, p.starts, p.shelf])).toEqual([
      ['A', 3, true, 0],
      ['A', 1, false, 1],
    ])
    expect(overflow).toEqual(['b0', 'b1'])
  })

  it('uses the column count of whichever run a row lands on', () => {
    const rows = rowSlots([run('wide', 3, 1), run('narrow', 2, 1)])
    const { placements } = fillRows([{ label: 'A', itemIds: ids('a', 5) }], rows)
    expect(placements.map((p) => [p.run.id, p.itemIds])).toEqual([
      ['wide', ['a0', 'a1', 'a2']],
      ['narrow', ['a3', 'a4']],
    ])
  })
})

describe('sections and signs', () => {
  const rows = rowSlots([run('one', 2, 2, 2), run('two', 2, 2)])
  const { placements } = fillRows(
    [
      { label: 'Drama', itemIds: ids('d', 9) },
      { label: 'Horror', itemIds: ids('h', 3) },
    ],
    rows,
  )

  it('groups slots by section with every label on it', () => {
    const sections = sectionsFrom(placements)
    expect(sections.map((s) => [s.id, s.slots.length, s.labels])).toEqual([
      ['one:0', 4, ['Drama']],
      ['one:1', 4, ['Drama']],
      ['two:0', 3, ['Drama', 'Horror']],
    ])
  })

  it('signs every bay with its genre and letter range', () => {
    const signs = baySigns(sectionsFrom(placements), 0.1, (id) => id.charAt(0).toUpperCase())
    expect(signs.map((sign) => [sign.id, sign.label])).toEqual([
      ['sign:one:0', 'Drama D'],
      ['sign:one:1', 'Drama D'],
      ['sign:two:0', 'Drama · Horror D–H'],
    ])
  })

  it('starts a bay-aligned group on a fresh bay', () => {
    const aligned = fillRows(
      [
        { label: 'Drama', itemIds: ids('d', 9) },
        { label: 'Horror', itemIds: ids('h', 3) },
      ],
      rows,
      true,
    )
    expect(aligned.placements.every((p) => p.label === 'Drama')).toBe(true)
    expect(aligned.overflow).toEqual(['h0', 'h1', 'h2'])
  })
})
