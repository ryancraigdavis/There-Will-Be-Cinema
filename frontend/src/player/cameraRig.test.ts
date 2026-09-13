import { describe, expect, it } from 'vitest'
import type { Pose } from '../scene/math'
import {
  advance,
  easeInOutCubic,
  isFinished,
  nextMode,
  poseAt,
  startTransition,
  transitionDuration,
} from './cameraRig'

const a: Pose = { position: [0, 1.6, 0], yaw: 3, pitch: 0 }
const b: Pose = { position: [2, 1.2, -2], yaw: -3, pitch: -0.4 }

describe('nextMode', () => {
  it.each([
    ['intro', 'enter', 'counter'],
    ['counter', 'focus', 'focus'],
    ['counter', 'walk', 'entering'],
    ['focus', 'back', 'counter'],
    ['focus', 'focus', 'focus'],
    ['entering', 'arrived', 'free'],
    ['free', 'back', 'counter'],
    ['counter', 'arrived', 'counter'],
    ['intro', 'walk', 'intro'],
    ['free', 'focus', 'free'],
  ] as const)('%s + %s -> %s', (mode, event, expected) => {
    expect(nextMode(mode, event)).toBe(expected)
  })
})

describe('transitions', () => {
  it('eases between endpoints', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(0.5)).toBe(0.5)
    expect(easeInOutCubic(1)).toBe(1)
  })

  it('starts at the origin pose and lands on the target', () => {
    const start = startTransition(a, b)
    expect(poseAt(start)).toEqual(a)
    const done = advance(start, 10)
    expect(isFinished(done)).toBe(true)
    const end = poseAt(done)
    expect(end.position.map((v) => +v.toFixed(6))).toEqual([2, 1.2, -2])
    expect(Math.abs(end.yaw)).toBeCloseTo(3)
    expect(end.pitch).toBeCloseTo(-0.4)
  })

  it('turns through the short side midway', () => {
    const mid = poseAt(advance(startTransition(a, b), transitionDuration(a, b) / 2))
    expect(Math.abs(mid.yaw)).toBeCloseTo(Math.PI, 1)
  })

  it('keeps durations in a comfortable range', () => {
    expect(transitionDuration(a, a)).toBe(0.5)
    const far: Pose = { position: [40, 0, 40], yaw: 0, pitch: 1 }
    expect(transitionDuration(a, far)).toBe(1.8)
  })
})
