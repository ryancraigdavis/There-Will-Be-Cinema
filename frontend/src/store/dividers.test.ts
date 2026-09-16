import { describe, expect, it } from 'vitest'
import { buildDividers } from './dividers'
import type { ShelfSection } from './fill'
import type { RunSpec } from './runs'

const run: RunSpec = {
  id: 'r',
  kind: 'genre',
  origin: [0, 0],
  normal: [0, 1],
  length: 1,
  sections: 1,
  columns: 3,
  rows: 2,
}

const slot = (itemId: string, y: number, x: number) => ({
  itemId,
  position: [x, y, 0] as const,
  yaw: 0,
})

const section: ShelfSection = {
  id: 's',
  run,
  index: 0,
  labels: ['Drama'],
  center: [0, 1, 0],
  slots: [
    slot('alien', 1.7, 0),
    slot('aliens', 1.7, 0.1),
    slot('barbarella', 1.7, 0.2),
    slot('casino', 1.3, 0),
  ],
}

describe('buildDividers', () => {
  it('marks the first tape and each change of letter on a shelf', () => {
    const made = buildDividers([section], (id) => id.charAt(0).toUpperCase())
    expect(made.map((d) => [d.letter, d.position[0]])).toEqual([
      ['A', 0],
      ['B', 0.2],
    ])
  })

  it('stands the tab above the tape it precedes', () => {
    const [first] = buildDividers([section], (id) => id.charAt(0).toUpperCase())
    expect(first?.position[1]).toBeGreaterThan(1.7)
    expect(first?.position[2]).toBe(0)
  })

  it('ignores the first tape of a later shelf when the letter carries over', () => {
    const carried = { ...section, slots: [...section.slots, slot('casino two', 1.3, 0.1)] }
    const made = buildDividers([carried], (id) => id.charAt(0).toUpperCase())
    expect(made.map((d) => d.letter)).toEqual(['A', 'B'])
  })

  it('takes no dividers from an empty section', () => {
    expect(buildDividers([{ ...section, slots: [] }], () => 'A')).toEqual([])
  })
})
