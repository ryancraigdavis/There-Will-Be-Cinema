import { create } from 'zustand'
import type { FixtureId } from '../lobby/anchors'
import { nextMode, type RigEvent, type RigMode } from '../player/cameraRig'

interface SceneState {
  mode: RigMode
  focus: FixtureId | null
  hoverLabel: string | null
  selected: string | null
  locked: boolean
  paused: boolean
  canvas: HTMLCanvasElement | null
  dispatch: (event: RigEvent, focus?: FixtureId) => void
  setHover: (label: string | null) => void
  select: (itemId: string | null) => void
  setLocked: (locked: boolean) => void
  setPaused: (paused: boolean) => void
  setCanvas: (canvas: HTMLCanvasElement | null) => void
}

export const useScene = create<SceneState>((set) => ({
  mode: 'intro',
  focus: null,
  hoverLabel: null,
  selected: null,
  locked: false,
  paused: false,
  canvas: null,
  dispatch: (event, focus) =>
    set((state) => {
      const mode = nextMode(state.mode, event)
      const nextFocus = mode === 'focus' ? (focus ?? state.focus) : null
      const unchanged = mode === state.mode && nextFocus === state.focus
      return unchanged
        ? state
        : { mode, focus: nextFocus, hoverLabel: null, selected: null, paused: false }
    }),
  setHover: (hoverLabel) => set({ hoverLabel }),
  select: (selected) => set({ selected, hoverLabel: null }),
  setLocked: (locked) => set({ locked }),
  setPaused: (paused) => set({ paused }),
  setCanvas: (canvas) => set({ canvas }),
}))

export function isInteractive(mode: RigMode, paused: boolean): boolean {
  return !paused && (mode === 'counter' || mode === 'focus' || mode === 'free')
}
