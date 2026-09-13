export type Vec3 = readonly [number, number, number]

export interface Pose {
  position: Vec3
  yaw: number
  pitch: number
}

const TAU = Math.PI * 2

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function wrapAngle(angle: number): number {
  return angle - TAU * Math.floor((angle + Math.PI) / TAU)
}

export function lerpAngle(a: number, b: number, t: number): number {
  return a + wrapAngle(b - a) * t
}

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
}

export function poseLookingAt(position: Vec3, target: Vec3): Pose {
  const dx = target[0] - position[0]
  const dy = target[1] - position[1]
  const dz = target[2] - position[2]
  return { position, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) }
}

export function forwardXZ(yaw: number): [number, number] {
  return [-Math.sin(yaw), -Math.cos(yaw)]
}

export function rightXZ(yaw: number): [number, number] {
  return [Math.cos(yaw), -Math.sin(yaw)]
}

export function lookDirection(pose: Pose): Vec3 {
  const cos = Math.cos(pose.pitch)
  return [-Math.sin(pose.yaw) * cos, Math.sin(pose.pitch), -Math.cos(pose.yaw) * cos]
}
