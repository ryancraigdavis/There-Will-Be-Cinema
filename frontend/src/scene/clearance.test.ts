import { describe, expect, it } from 'vitest'
import { rayClearance, rayHitsBox } from './clearance'

const wall = { minX: -5, maxX: 5, minZ: -3, maxZ: -2.8 }

describe('clearance', () => {
  it.each([
    ['a wall ahead', { x: 0, z: 0 }, { x: 0, z: -1 }, 2.8],
    ['a wall behind', { x: 0, z: 0 }, { x: 0, z: 1 }, null],
    ['a wall off to the side', { x: 9, z: 0 }, { x: 0, z: -1 }, null],
    ['standing inside it', { x: 0, z: -2.9 }, { x: 0, z: -1 }, 0],
    ['at an angle', { x: 0, z: 0 }, { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, 2.8 * Math.SQRT2],
  ])('%s', (_name, origin, direction, expected) => {
    const hit = rayHitsBox(origin, direction, wall)
    expected === null ? expect(hit).toBeNull() : expect(hit).toBeCloseTo(expected, 6)
  })

  it.each([
    ['the nearest box', [wall, { minX: -1, maxX: 1, minZ: -1.2, maxZ: -1 }], 1],
    ['the wall when nothing is closer', [wall], 2.8],
    ['the far limit with no boxes', [], 5],
    ['the far limit when the wall is beyond it', [wall], 5, 2],
  ])('measures %s', (_name, boxes, expected, far = 5) => {
    expect(rayClearance({ x: 0, z: 0 }, { x: 0, z: -1 }, boxes, far)).toBeCloseTo(
      Math.min(expected, far),
      6,
    )
  })
})
