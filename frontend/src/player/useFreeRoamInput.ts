import { type RefObject, useEffect, useRef } from 'react'
import { useScene } from '../shell/sceneState'
import type { RigMode } from './cameraRig'
import { isRunKey, MOVEMENT_KEYS } from './keys'

export interface RoamInput {
  keys: Set<string>
  dx: number
  dy: number
  dragging: boolean
}

type Scene = ReturnType<typeof useScene.getState>

const MAX_MOVEMENT_PX = 250

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

function lookDelta(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  dragging: boolean,
): [number, number] {
  const plausible =
    Math.abs(event.movementX) < MAX_MOVEMENT_PX && Math.abs(event.movementY) < MAX_MOVEMENT_PX
  const looking = plausible && (document.pointerLockElement === canvas || dragging)
  return looking ? [event.movementX, event.movementY] : [0, 0]
}

function startsDrag(event: PointerEvent, canvas: HTMLCanvasElement): boolean {
  return (
    event.button === 0 &&
    document.pointerLockElement !== canvas &&
    useScene.getState().mode === 'free'
  )
}

export function useFreeRoamInput(
  canvas: HTMLCanvasElement | null,
  enabled: boolean,
): RefObject<RoamInput> {
  const input = useRef<RoamInput>({ keys: new Set(), dx: 0, dy: 0, dragging: false })

  useEffect(() => {
    const state = input.current
    if (!canvas || !enabled) {
      return
    }
    const keydown = (event: KeyboardEvent) => handleKeyDown(event, state)
    const keyup = (event: KeyboardEvent) => state.keys.delete(event.code)
    const mousemove = (event: MouseEvent) => {
      const [dx, dy] = lookDelta(event, canvas, state.dragging)
      state.dx += dx
      state.dy += dy
    }
    const pointerdown = (event: PointerEvent) => {
      state.dragging = startsDrag(event, canvas)
    }
    const release = () => {
      state.dragging = false
    }
    const blur = () => {
      state.keys.clear()
      state.dragging = false
    }
    const lockchange = () => handleLockChange(canvas)

    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('mousemove', mousemove)
    window.addEventListener('pointerup', release)
    window.addEventListener('blur', blur)
    canvas.addEventListener('pointerdown', pointerdown)
    document.addEventListener('pointerlockchange', lockchange)
    return () => {
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('mousemove', mousemove)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('blur', blur)
      canvas.removeEventListener('pointerdown', pointerdown)
      document.removeEventListener('pointerlockchange', lockchange)
      blur()
    }
  }, [canvas, enabled])

  return input
}
