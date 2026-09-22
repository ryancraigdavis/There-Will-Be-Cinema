import { describe, expect, it } from 'vitest'
import { beam, corner, DERRICK_SHAPE, derrickBeams } from './derrick'

describe('derrick', () => {
  it.each([
    ['a base corner', 0, 1, 1, [0.5, 0, 0.5]],
    ['a top corner', 1, -1, 1, [-0.13, 2.8, 0.13]],
    ['halfway up', 0.5, 1, -1, [0.315, 1.4, -0.315]],
  ])('%s', (_name, height, sx, sz, expected) => {
    expect(corner(height, sx, sz).map((v) => Math.round(v * 1000) / 1000)).toEqual(expected)
  })

  it('turns a span into a scaled, oriented unit box', () => {
    const b = beam([0, 0, 0], [0, 2, 0], 0.1, '#fff')
    expect(b.position).toEqual([0, 1, 0])
    expect(b.scale).toEqual([0.1, 2, 0.1])
    expect(b.quaternion?.map((v) => Math.round(v * 1000) / 1000)).toEqual([0, 0, 0, 1])
    const tilted = beam([0, 0, 0], [3, 4, 0], 0.1, '#fff')
    expect(tilted.scale?.[1]).toBeCloseTo(5)
  })

  it('has four legs, twelve rings and twelve braces', () => {
    const beams = derrickBeams()
    expect(beams).toHaveLength(28)
    expect(beams.filter((b) => b.color === '#4b3220')).toHaveLength(12)
    expect(beams.slice(0, 4).every((b) => (b.scale?.[1] ?? 0) > DERRICK_SHAPE.height)).toBe(true)
  })
})
