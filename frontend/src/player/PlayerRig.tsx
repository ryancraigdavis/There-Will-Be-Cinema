import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Camera } from 'three'
import { ANCHORS, type AnchorId, type FixtureId } from '../lobby/anchors'
import type { Pose } from '../scene/math'
import { useScene } from '../shell/sceneState'
import {
  advance,
  isFinished,
  poseAt,
  type RigMode,
  startTransition,
  type Transition,
} from './cameraRig'
import type { AABB } from './collision'
import { inputFromKeys } from './keys'
import { isMoving, look, walk } from './locomotion'
import { type RoamInput, useFreeRoamInput } from './useFreeRoamInput'

type Scene = ReturnType<typeof useScene.getState>

interface Offset {
  yaw: number
  pitch: number
}

const TARGETS: Record<RigMode, (focus: FixtureId | null) => AnchorId | null> = {
  intro: () => 'counter',
  counter: () => 'counter',
  focus: (focus) => focus ?? 'counter',
  entering: () => 'storeEntry',
  free: () => null,
}

const PARALLAX = { yaw: 0.09, pitch: 0.05, rate: 4 }
const MAX_FRAME_SECONDS = 0.1

function applyPose(camera: Camera, pose: Pose, offset: Offset) {
  camera.position.set(pose.position[0], pose.position[1], pose.position[2])
  camera.rotation.set(pose.pitch + offset.pitch, pose.yaw + offset.yaw, 0, 'YXZ')
}

function roam(
  pose: Pose,
  input: RoamInput,
  scene: Scene,
  dt: number,
  colliders: readonly AABB[],
): Pose {
  const canLook = scene.mode === 'free' && !scene.paused
  const looked = canLook ? look(pose, input.dx, input.dy) : pose
  input.dx = 0
  input.dy = 0
  const move = inputFromKeys(input.keys)
  const canWalk = canLook && !scene.selected && isMoving(move)
  return canWalk ? walk(looked, move, dt, colliders) : looked
}

function smoothParallax(
  offset: Offset,
  pointer: { x: number; y: number },
  lobby: boolean,
  dt: number,
) {
  const k = Math.min(1, dt * PARALLAX.rate)
  const yaw = lobby ? -pointer.x * PARALLAX.yaw : 0
  const pitch = lobby ? pointer.y * PARALLAX.pitch : 0
  offset.yaw += (yaw - offset.yaw) * k
  offset.pitch += (pitch - offset.pitch) * k
}

interface FrameResult {
  pose: Pose
  transition: Transition | null
  arrived: boolean
}

function stepRig(
  pose: Pose,
  transition: Transition | null,
  input: RoamInput,
  scene: Scene,
  dt: number,
  colliders: readonly AABB[],
): FrameResult {
  const stepped = transition ? advance(transition, dt) : null
  input.dx = stepped ? 0 : input.dx
  input.dy = stepped ? 0 : input.dy
  const arrived = stepped !== null && isFinished(stepped)
  return {
    pose: stepped ? poseAt(stepped) : roam(pose, input, scene, dt, colliders),
    transition: arrived ? null : stepped,
    arrived,
  }
}

const isLobby = (mode: RigMode) => mode === 'counter' || mode === 'focus'

interface Props {
  colliders: readonly AABB[]
  active: boolean
}

export function PlayerRig({ colliders, active }: Props) {
  const camera = useThree((state) => state.camera)
  const canvas = useScene((state) => state.canvas)
  const mode = useScene((state) => state.mode)
  const focus = useScene((state) => state.focus)
  const input = useFreeRoamInput(canvas, active)
  const pose = useRef<Pose>(ANCHORS.counter)
  const transition = useRef<Transition | null>(null)
  const parallax = useRef<Offset>({ yaw: 0, pitch: 0 })
  const target = TARGETS[mode](focus)

  useEffect(() => {
    transition.current = target ? startTransition(pose.current, ANCHORS[target]) : null
  }, [target])

  useFrame((state, delta) => {
    const dt = Math.min(delta, MAX_FRAME_SECONDS)
    const scene = useScene.getState()
    const before = pose.current
    const result = stepRig(before, transition.current, input.current, scene, dt, colliders)
    pose.current = result.pose
    transition.current = result.transition
    if (result.arrived && scene.mode === 'entering') {
      scene.dispatch('arrived')
    }
    smoothParallax(parallax.current, state.pointer, !result.transition && isLobby(scene.mode), dt)
    applyPose(camera, result.pose, parallax.current)
    if (result.pose !== before && scene.mode === 'free') {
      state.events.update?.()
    }
  })

  return null
}
