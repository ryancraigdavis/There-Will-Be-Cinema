import { describe, expect, it } from 'vitest'
import { BASE_FOV, fovFor } from './fov'

describe('fovFor', () => {
  it.each([
    ['landscape keeps the base', 'counter', 16 / 9, BASE_FOV.counter],
    ['square keeps the base', 'free', 1, BASE_FOV.free],
    ['portrait widens', 'free', 0.5, BASE_FOV.free + 22.5],
    ['very tall screens are capped', 'counter', 0.1, 100],
  ] as const)('%s', (_name, mode, aspect, expected) => {
    expect(fovFor(mode, aspect)).toBeCloseTo(expected)
  })
})
