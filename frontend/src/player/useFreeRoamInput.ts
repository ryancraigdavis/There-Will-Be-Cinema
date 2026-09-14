import { type RefObject, useEffect, useRef } from 'react'
import { useScene } from '../shell/sceneState'
import type { RigMode } from './cameraRig'
import { isRunKey, MOVEMENT_KEYS } from './keys'

export interface RoamInput {
  keys: Set<string>
  dx: number
  dy: number
  dragPointer: number | null
  lastX: number
  lastY: number
}

type Scene = ReturnType<typeof useScene.getState>

const MAX_MOVEMENT_PX = 250
const DRAG_MODES: ReadonlySet<RigMode> = new Set(['counter', 'focus', 'free'])

const ESCAPE: Partial<Record<RigMode, (scene: Scene) => void>> = {
  focus: (scene) => scene.dispatch('back'),
  entering: (scene) => scene.dispatch('back'),
  free: (scene) => (scene.selected ? scene.select(null) : scene.setPaused(true)),
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

function handleKeyDown(event: KeyboardEvent, input: RoamInput) {
  const scene = useScene.getState()
  if (event.code === 'Escape') {
    ESCAPE[scene.mode]?.(scene)
  }
  const moving = MOVEMENT_KEYS.has(event.code) && scene.mode === 'free' && !isTyping(event.target)
  if (!moving) {
    return
  }
  event.preventDefault()
  input.keys.add(event.code)
  if (scene.selected && !isRunKey(event.code)) {
    scene.select(null)
  }
}

function handleLockChange(canvas: HTMLCanvasElement) {
  const scene = useScene.getState()
  const locked = document.pointerLockElement === canvas
  scene.setLocked(locked)
  if (!locked && scene.mode === 'free') {
    scene.setPaused(true)
  }
}

function lockedDelta(event: MouseEvent, canvas: HTMLCanvasElement): [number, number] {
  const plausible =
    Math.abs(event.movementX) < MAX_MOVEMENT_PX && Math.abs(event.movementY) < MAX_MOVEMENT_PX
  const locked = document.pointerLockElement === canvas
  return plausible && locked ? [event.movementX, event.movementY] : [0, 0]
}

function startDrag(event: PointerEvent, canvas: HTMLCanvasElement, input: RoamInput) {
  const allowed =
    input.dragPointer === null &&
    event.button === 0 &&
    document.pointerLockElement !== canvas &&
    DRAG_MODES.has(useScene.getState().mode)
  input.dragPointer = allowed ? event.pointerId : input.dragPointer
  input.lastX = allowed ? event.clientX : input.lastX
  input.lastY = allowed ? event.clientY : input.lastY
}

function dragDelta(event: PointerEvent, input: RoamInput) {
  const mine = event.pointerId === input.dragPointer
  input.dx += mine ? event.clientX - input.lastX : 0
  input.dy += mine ? event.clientY - input.lastY : 0
  input.lastX = mine ? event.clientX : input.lastX
  input.lastY = mine ? event.clientY : input.lastY
}

function endDrag(event: PointerEvent, input: RoamInput) {
  input.dragPointer = event.pointerId === input.dragPointer ? null : input.dragPointer
}

export function useFreeRoamInput(
  canvas: HTMLCanvasElement | null,
  enabled: boolean,
): RefObject<RoamInput> {
  const input = useRef<RoamInput>({
    keys: new Set(),
    dx: 0,
    dy: 0,
    dragPointer: null,
    lastX: 0,
    lastY: 0,
  })

  useEffect(() => {
    const state = input.current
    if (!canvas || !enabled) {
      return
    }
    const keydown = (event: KeyboardEvent) => handleKeyDown(event, state)
    const keyup = (event: KeyboardEvent) => state.keys.delete(event.code)
    const mousemove = (event: MouseEvent) => {
      const [dx, dy] = lockedDelta(event, canvas)
      state.dx += dx
      state.dy += dy
    }
    const pointerdown = (event: PointerEvent) => startDrag(event, canvas, state)
    const pointermove = (event: PointerEvent) => dragDelta(event, state)
    const pointerup = (event: PointerEvent) => endDrag(event, state)
    const blur = () => {
      state.keys.clear()
      state.dragPointer = null
    }
    const lockchange = () => handleLockChange(canvas)

    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('mousemove', mousemove)
    window.addEventListener('pointermove', pointermove)
    window.addEventListener('pointerup', pointerup)
    window.addEventListener('pointercancel', pointerup)
    window.addEventListener('blur', blur)
    canvas.addEventListener('pointerdown', pointerdown)
    document.addEventListener('pointerlockchange', lockchange)
    return () => {
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('mousemove', mousemove)
      window.removeEventListener('pointermove', pointermove)
      window.removeEventListener('pointerup', pointerup)
      window.removeEventListener('pointercancel', pointerup)
      window.removeEventListener('blur', blur)
      canvas.removeEventListener('pointerdown', pointerdown)
      document.removeEventListener('pointerlockchange', lockchange)
      blur()
    }
  }, [canvas, enabled])

  return input
}
