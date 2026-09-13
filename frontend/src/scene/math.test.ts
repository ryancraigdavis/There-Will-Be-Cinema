import { describe, expect, it } from 'vitest'
import { forwardXZ, lerpAngle, lookDirection, poseLookingAt, rightXZ, wrapAngle } from './math'

describe('angles', () => {
  it.each([
    [0, 0],
    [Math.PI * 2 + 0.5, 0.5],
    [-Math.PI - 0.1, Math.PI - 0.1],
    [Math.PI, -Math.PI],
  ])('wrapAngle(%s)', (input, expected) => {
    expect(wrapAngle(input)).toBeCloseTo(expected)
  })

  it('interpolates the short way around', () => {
    expect(Math.abs(lerpAngle(3, -3, 0.5))).toBeCloseTo(Math.PI, 2)
  })
})

describe('poses', () => {
  it.each([
    ['ahead', [0, 0, -1], 0, 0],
    ['right', [1, 0, 0], -Math.PI / 2, 0],
    ['behind', [0, 0, 1], Math.PI, 0],
    ['up', [0, 1, -1], 0, Math.PI / 4],
  ] as const)('looks %s', (_name, target, yaw, pitch) => {
    const pose = poseLookingAt([0, 0, 0], target)
    expect(Math.abs(wrapAngle(pose.yaw - yaw))).toBeCloseTo(0)
    expect(pose.pitch).toBeCloseTo(pitch)
  })

  it('round-trips a look direction', () => {
    const pose = poseLookingAt([1, 1.6, 2], [4, 1, -2])
    const [dx, dy, dz] = lookDirection(pose)
    const length = Math.hypot(3, -0.6, -4)
    expect([dx, dy, dz].map((v) => v.toFixed(4))).toEqual(
      [3 / length, -0.6 / length, -4 / length].map((v) => v.toFixed(4)),
    )
  })

  it('keeps right perpendicular to forward', () => {
    const [fx, fz] = forwardXZ(0.7)
    const [rx, rz] = rightXZ(0.7)
    expect(fx * rx + fz * rz).toBeCloseTo(0)
    expect(rightXZ(0)).toEqual([1, -0])
  })
})
