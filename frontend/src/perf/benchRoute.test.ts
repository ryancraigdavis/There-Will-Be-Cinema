import { describe, expect, it } from 'vitest'
import {
  type BenchSegment,
  keyChanges,
  nearestItem,
  ROUTE,
  segmentIndexAt,
  totalFrames,
} from './benchRoute'

const route: BenchSegment[] = [
  { label: 'a', frames: 10 },
  { label: 'b', frames: 5, keys: ['KeyW'] },
  { label: 'c', frames: 1 },
]

describe('bench route', () => {
  it.each([
    ['before it starts', -1, -1],
    ['first frame', 0, 0],
    ['last frame of the first segment', 9, 0],
    ['first frame of the second', 10, 1],
    ['the one-frame segment', 15, 2],
    ['after the end', 16, -1],
  ])('%s', (_name, frame, expected) => {
    expect(segmentIndexAt(route, frame)).toBe(expected)
  })

  it('adds up', () => {
    expect(totalFrames(route)).toBe(16)
    expect(totalFrames([])).toBe(0)
  })

  it.each([
    ['start walking', [], ['KeyW'], { up: [], down: ['KeyW'] }],
    ['stop', ['KeyW'], [], { up: ['KeyW'], down: [] }],
    ['keep walking', ['KeyW'], ['KeyW'], { up: [], down: [] }],
    ['change direction', ['KeyD'], ['KeyA'], { up: ['KeyD'], down: ['KeyA'] }],
  ])('keys: %s', (_name, held, next, expected) => {
    expect(keyChanges(held, next)).toEqual(expected)
  })

  it.each([
    ['nothing on the shelves', [], null],
    [
      'the closest on the floor plan, ignoring height',
      [
        ['far', 5, 0, 5],
        ['near', 1, 9, 1],
      ],
      'near',
    ],
    [
      'the first of two equally close',
      [
        ['first', 1, 0, 0],
        ['second', -1, 0, 0],
      ],
      'first',
    ],
  ] as const)('selects %s', (_name, placed, expected) => {
    const slots = placed.map(([itemId, x, y, z]) => ({ itemId, position: [x, y, z] as const }))
    expect(nearestItem(slots, 0, 0)).toBe(expected)
  })

  it('only presses keys the player understands and deselects by walking', () => {
    const keys = new Set(ROUTE.flatMap((segment) => segment.keys ?? []))
    expect([...keys].sort()).toEqual(['KeyA', 'KeyD', 'KeyS', 'KeyW'])
    const select = ROUTE.findIndex((segment) => segment.action === 'select')
    expect(ROUTE[select + 1]?.keys).toEqual(['KeyW'])
  })
})
