import { clamp, forwardXZ, type Pose, rightXZ, wrapAngle } from '../scene/math'
import { type AABB, moveCircle, type PointXZ } from './collision'

export const EYE_HEIGHT = 1.62
export const WALK_SPEED = 2.2
export const RUN_MULTIPLIER = 1.8
export const PLAYER_RADIUS = 0.28
export const LOOK_SENSITIVITY = 0.0022
export const PITCH_LIMIT = 1.45
export const MAX_STEP_SECONDS = 0.05

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
  const step = Math.min(dt, MAX_STEP_SECONDS)
  const v = velocity(pose.yaw, input)
  const next = moveCircle(
    { x: pose.position[0], z: pose.position[2] },
    { x: v.x * step, z: v.z * step },
    PLAYER_RADIUS,
    colliders,
  )
  return { ...pose, position: [next.x, pose.position[1], next.z] }
}

export function isMoving(input: MoveInput): boolean {
  return input.forward !== 0 || input.strafe !== 0
}
