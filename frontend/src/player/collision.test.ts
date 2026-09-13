import { describe, expect, it } from 'vitest'
import { type AABB, boxesOverlap, moveCircle, overlapsCircle } from './collision'

const wall: AABB = { minX: 1, maxX: 2, minZ: -5, maxZ: 5 }

describe('collision', () => {
  it.each([
    ['clear', { x: 0, z: 0 }, false],
    ['touching edge within radius', { x: 0.8, z: 0 }, true],
    ['inside', { x: 1.5, z: 0 }, true],
    ['near corner but outside', { x: 0.75, z: 5.25 }, false],
  ])('overlapsCircle %s', (_name, center, expected) => {
    expect(overlapsCircle(center, 0.3, wall)).toBe(expected)
  })

  it('moves freely when nothing is in the way', () => {
    expect(moveCircle({ x: 0, z: 0 }, { x: 0.1, z: -0.2 }, 0.3, [wall])).toEqual({
      x: 0.1,
      z: -0.2,
    })
  })

  it('slides along a wall instead of stopping', () => {
    expect(moveCircle({ x: 0.65, z: 0 }, { x: 0.1, z: -0.2 }, 0.3, [wall])).toEqual({
      x: 0.65,
      z: -0.2,
    })
  })

  it('detects overlapping boxes', () => {
    expect(boxesOverlap(wall, { minX: 1.5, maxX: 3, minZ: 0, maxZ: 1 })).toBe(true)
    expect(boxesOverlap(wall, { minX: 2, maxX: 3, minZ: 0, maxZ: 1 })).toBe(false)
  })
})
