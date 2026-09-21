import { clamp, distance, lerp, lerpAngle, lerpVec3, type Pose, wrapAngle } from '../scene/math'

export type RigMode = 'intro' | 'counter' | 'entering' | 'free'
export type RigEvent = 'enter' | 'back' | 'walk' | 'arrived'

const TRANSITIONS: Record<RigMode, Partial<Record<RigEvent, RigMode>>> = {
  intro: { enter: 'counter' },
  counter: { walk: 'entering' },
  entering: { arrived: 'free', back: 'counter' },
  free: { back: 'counter' },
}

export function nextMode(mode: RigMode, event: RigEvent): RigMode {
  return TRANSITIONS[mode][event] ?? mode
}

export interface Transition {
  from: Pose
  to: Pose
  elapsed: number
  duration: number
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
}

export function transitionDuration(from: Pose, to: Pose): number {
  const turn = Math.abs(wrapAngle(to.yaw - from.yaw)) + Math.abs(to.pitch - from.pitch)
  return clamp(0.45 + distance(from.position, to.position) * 0.22 + turn * 0.3, 0.5, 1.8)
}

export function startTransition(from: Pose, to: Pose): Transition {
  return { from, to, elapsed: 0, duration: transitionDuration(from, to) }
}

export function advance(transition: Transition, dt: number): Transition {
  return { ...transition, elapsed: Math.min(transition.elapsed + dt, transition.duration) }
}

export function isFinished(transition: Transition): boolean {
  return transition.elapsed >= transition.duration
}

export function poseAt(transition: Transition): Pose {
  const { from, to } = transition
  const t = easeInOutCubic(transition.elapsed / transition.duration)
  return {
    position: lerpVec3(from.position, to.position, t),
    yaw: wrapAngle(lerpAngle(from.yaw, to.yaw, t)),
    pitch: lerp(from.pitch, to.pitch, t),
  }
}
