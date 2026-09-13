import { describe, expect, it } from 'vitest'
import type { Pose } from '../scene/math'
import {
  IDLE,
  look,
  MAX_STEP_SECONDS,
  PITCH_LIMIT,
  RUN_MULTIPLIER,
  velocity,
  WALK_SPEED,
  walk,
} from './locomotion'

const origin: Pose = { position: [0, 1.62, 0], yaw: 0, pitch: 0 }
const rounded = (p: { x: number; z: number }) => ({
  x: +p.x.toFixed(4) + 0,
  z: +p.z.toFixed(4) + 0,
})

describe('velocity', () => {
  it.each([
    ['forward faces -z', 0, { forward: 1, strafe: 0, run: false }, { x: 0, z: -WALK_SPEED }],
    ['strafe right is +x', 0, { forward: 0, strafe: 1, run: false }, { x: WALK_SPEED, z: 0 }],
    [
      'turned left, forward is -x',
      Math.PI / 2,
      { forward: 1, strafe: 0, run: false },
      { x: -WALK_SPEED, z: 0 },
    ],
    ['idle', 0, IDLE, { x: 0, z: 0 }],
  ])('%s', (_name, yaw, input, expected) => {
    expect(rounded(velocity(yaw, input))).toEqual(rounded(expected))
  })

  it('does not speed up diagonally', () => {
    const v = velocity(0, { forward: 1, strafe: 1, run: false })
    expect(Math.hypot(v.x, v.z)).toBeCloseTo(WALK_SPEED)
  })

  it('runs faster', () => {
    const v = velocity(0, { forward: 1, strafe: 0, run: true })
    expect(-v.z).toBeCloseTo(WALK_SPEED * RUN_MULTIPLIER)
  })
})

describe('walk', () => {
  const forward = { forward: 1, strafe: 0, run: false }

  it('scales with time', () => {
    expect(walk(origin, forward, 0.02, []).position[2]).toBeCloseTo(-WALK_SPEED * 0.02)
  })

  it('caps long frames so walls cannot be skipped', () => {
    expect(walk(origin, forward, 1, []).position[2]).toBeCloseTo(-WALK_SPEED * MAX_STEP_SECONDS)
  })

  it('stops at a wall', () => {
    const wall = [{ minX: -1, maxX: 1, minZ: -0.35, maxZ: -0.3 }]
    expect(walk(origin, forward, 0.05, wall).position).toEqual(origin.position)
  })
})

describe('look', () => {
  it('turns right when the mouse moves right', () => {
    expect(look(origin, 100, 0).yaw).toBeLessThan(0)
  })

  it('clamps pitch', () => {
    expect(look(origin, 0, -100000).pitch).toBe(PITCH_LIMIT)
    expect(look(origin, 0, 100000).pitch).toBe(-PITCH_LIMIT)
  })
})
