import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Camera, PerspectiveCamera } from 'three'
import { ANCHORS, type AnchorId } from '../lobby/anchors'
import { FIXED_STEP_MS } from '../perf/perf'
import { type Pose, samePose } from '../scene/math'
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
import { fovFor } from './fov'
import { frameDt } from './frameDt'
import { moveInput } from './keys'
import { isMoving, look, lookAround, walk } from './locomotion'
import { touchStick } from './touchStick'
import { type RoamInput, useFreeRoamInput } from './useFreeRoamInput'

type Scene = ReturnType<typeof useScene.getState>

interface StepContext {
  pose: Pose
  input: RoamInput
  scene: Scene
  dt: number
  colliders: readonly AABB[]
  anchor: Pose | null
}

interface FrameResult {
  pose: Pose
  transition: Transition | null
  arrived: boolean
}

const TARGETS: Record<RigMode, AnchorId | null> = {
  intro: 'counter',
  counter: 'counter',
  entering: 'storeEntry',
  free: null,
}

const ARRIVE: Partial<Record<RigMode, (scene: Scene) => void>> = {
  entering: (scene) => scene.dispatch('arrived'),
}

const FOV_RATE = 3
const MAX_FRAME_SECONDS = 0.1

function arriveNow(scene: Scene, pending: string | null) {
  ARRIVE[scene.mode]?.(scene)
  if (pending) {
    scene.select(pending)
  }
}

function takeLook(input: RoamInput): [number, number] {
  const delta: [number, number] = [input.dx, input.dy]
  input.dx = 0
  input.dy = 0
  return delta
}

function hold({ pose, input }: StepContext): Pose {
  takeLook(input)
  return pose
}

function lookAroundLobby({ pose, input, scene, anchor }: StepContext): Pose {
  const [dx, dy] = takeLook(input)
  return anchor && !scene.paused ? lookAround(pose, anchor, dx, dy) : pose
}

function roamStore({ pose, input, scene, dt, colliders }: StepContext): Pose {
  const [dx, dy] = takeLook(input)
  const looked = scene.paused ? pose : look(pose, dx, dy)
  const move = moveInput(input.keys, touchStick)
  const canWalk = !scene.paused && !scene.selected && isMoving(move)
  return canWalk ? walk(looked, move, dt, colliders) : looked
}

const STEPPERS: Record<RigMode, (context: StepContext) => Pose> = {
  intro: hold,
  counter: lookAroundLobby,
  entering: hold,
  free: roamStore,
}

function stepRig(context: StepContext, transition: Transition | null): FrameResult {
  const stepped = transition ? advance(transition, context.dt) : null
  const arrived = stepped !== null && isFinished(stepped)
  const pose = stepped ? poseAt(stepped) : STEPPERS[context.scene.mode](context)
  return { pose, transition: arrived ? null : stepped, arrived }
}

function applyPose(camera: Camera, pose: Pose) {
  camera.position.set(pose.position[0], pose.position[1], pose.position[2])
  camera.rotation.set(pose.pitch, pose.yaw, 0, 'YXZ')
}

function easeFov(camera: Camera, target: number, dt: number) {
  const perspective = camera as PerspectiveCamera
  const next = perspective.fov + (target - perspective.fov) * Math.min(1, dt * FOV_RATE)
  if (Math.abs(next - perspective.fov) > 0.01) {
    perspective.fov = next
    perspective.updateProjectionMatrix()
  }
}

interface Props {
  colliders: readonly AABB[]
  active: boolean
}

export function PlayerRig({ colliders, active }: Props) {
  const camera = useThree((state) => state.camera)
  const canvas = useScene((state) => state.canvas)
  const mode = useScene((state) => state.mode)
  const travel = useScene((state) => state.travel)
  const input = useFreeRoamInput(canvas, active)
  const pose = useRef<Pose>(ANCHORS.counter)
  const transition = useRef<Transition | null>(null)
  const arriveWith = useRef<string | null>(null)
  const target = TARGETS[mode]

  useEffect(() => {
    transition.current = target ? startTransition(pose.current, ANCHORS[target]) : null
  }, [target])

  useEffect(() => {
    if (!travel || mode !== 'free') {
      return
    }
    transition.current = startTransition(pose.current, travel.pose)
    arriveWith.current = travel.itemId
    useScene.getState().setTravel(null)
  }, [travel, mode])

  useFrame((state, delta) => {
    const dt = Math.min(frameDt(delta, FIXED_STEP_MS), MAX_FRAME_SECONDS)
    const scene = useScene.getState()
    const anchor = target ? ANCHORS[target] : null
    const before = pose.current
    const context = { pose: before, input: input.current, scene, dt, colliders, anchor }
    const result = stepRig(context, transition.current)
    pose.current = result.pose
    transition.current = result.transition
    if (result.arrived) {
      arriveNow(scene, arriveWith.current)
      arriveWith.current = null
    }
    applyPose(camera, result.pose)
    easeFov(camera, fovFor(scene.mode, state.viewport.aspect), dt)
    if (!samePose(before, result.pose) && scene.mode !== 'intro') {
      state.events.update?.()
    }
  })

  return null
}
