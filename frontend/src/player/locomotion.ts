import { clamp, forwardXZ, type Pose, rightXZ, wrapAngle } from '../scene/math'
import { type AABB, moveCircle, type PointXZ } from './collision'

export const EYE_HEIGHT = 1.62
export const WALK_SPEED = 2.2
export const RUN_MULTIPLIER = 1.8
export const PLAYER_RADIUS = 0.28
export const LOOK_SENSITIVITY = 0.0022
export const PITCH_LIMIT = 1.45
export const MAX_STEP_SECONDS = 0.05
export const MAX_WALK_SECONDS = 0.1

export interface MoveInput {
  forward: number
  strafe: number
  run: boolean
}

export const IDLE: MoveInput = { forward: 0, strafe: 0, run: false }

export function look(pose: Pose, dx: number, dy: number, sensitivity = LOOK_SENSITIVITY): Pose {
  return {
    ...pose,
    yaw: wrapAngle(pose.yaw - dx * sensitivity),
    pitch: clamp(pose.pitch - dy * sensitivity, -PITCH_LIMIT, PITCH_LIMIT),
  }
}

export function velocity(yaw: number, input: MoveInput): PointXZ {
  const [fx, fz] = forwardXZ(yaw)
  const [rx, rz] = rightXZ(yaw)
  const x = fx * input.forward + rx * input.strafe
  const z = fz * input.forward + rz * input.strafe
  const speed = WALK_SPEED * (input.run ? RUN_MULTIPLIER : 1)
  const scale = speed / Math.max(Math.hypot(x, z), 1)
  return { x: x * scale, z: z * scale }
}

export function walk(pose: Pose, input: MoveInput, dt: number, colliders: readonly AABB[]): Pose {
  const total = Math.min(dt, MAX_WALK_SECONDS)
  const steps = Math.max(1, Math.ceil(total / MAX_STEP_SECONDS))
  const v = velocity(pose.yaw, input)
  const delta = { x: (v.x * total) / steps, z: (v.z * total) / steps }
  let point = { x: pose.position[0], z: pose.position[2] }
  for (let step = 0; step < steps; step++) {
    point = moveCircle(point, delta, PLAYER_RADIUS, colliders)
  }
  return { ...pose, position: [point.x, pose.position[1], point.z] }
}

export function isMoving(input: MoveInput): boolean {
  return input.forward !== 0 || input.strafe !== 0
}

export const LOBBY_LOOK = { yaw: 1.05, pitch: 0.4 } as const

export function lookAround(pose: Pose, anchor: Pose, dx: number, dy: number): Pose {
  const turned = look(pose, dx, dy)
  const offset = clamp(wrapAngle(turned.yaw - anchor.yaw), -LOBBY_LOOK.yaw, LOBBY_LOOK.yaw)
  return {
    ...turned,
    yaw: wrapAngle(anchor.yaw + offset),
    pitch: clamp(turned.pitch, anchor.pitch - LOBBY_LOOK.pitch, anchor.pitch + LOBBY_LOOK.pitch),
  }
}
