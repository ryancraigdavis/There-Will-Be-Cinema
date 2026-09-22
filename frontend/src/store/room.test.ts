import { describe, expect, it } from 'vitest'
import { bandTransforms, trofferTransforms, WALL_BANDS } from './room'

describe('room', () => {
  it('lays each wall band along all four walls', () => {
    const trim = WALL_BANDS.find((band) => band.id === 'trim')
    const transforms = bandTransforms(trim as (typeof WALL_BANDS)[number])
    expect(transforms).toHaveLength(4)
    expect(transforms.map((t) => t.position[1])).toEqual([1.13, 1.13, 1.13, 1.13])
    expect(transforms.map((t) => t.scale?.[0])).toEqual([21.4, 21.4, 14, 14])
    expect(transforms.map((t) => t.yaw)).toEqual([Math.PI / 2, Math.PI / 2, 0, 0])
  })

  it('lays 28 troffers face down just below the ceiling', () => {
    const troffers = trofferTransforms()
    expect(troffers).toHaveLength(28)
    expect(new Set(troffers.map((t) => t.position[1]))).toEqual(new Set([2.99]))
  })
})
