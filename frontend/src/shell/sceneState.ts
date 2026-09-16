import { create } from 'zustand'
import type { FixtureId } from '../lobby/anchors'
import { nextMode, type RigEvent, type RigMode } from '../player/cameraRig'
import type { Pose } from '../scene/math'

export interface Travel {
  pose: Pose
  itemId: string | null
}

interface SceneState {
  mode: RigMode
  focus: FixtureId | null
  hoverLabel: string | null
  selected: string | null
  locked: boolean
  paused: boolean
  guide: boolean
  travel: Travel | null
  canvas: HTMLCanvasElement | null
  dispatch: (event: RigEvent, focus?: FixtureId) => void
  setHover: (label: string | null) => void
  select: (itemId: string | null) => void
  setLocked: (locked: boolean) => void
  setPaused: (paused: boolean) => void
  setGuide: (guide: boolean) => void
  setTravel: (travel: Travel | null) => void
  setCanvas: (canvas: HTMLCanvasElement | null) => void
}

export const useScene = create<SceneState>((set) => ({
  mode: 'intro',
  focus: null,
  hoverLabel: null,
  selected: null,
  locked: false,
  paused: false,
  guide: false,
  travel: null,
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
  setGuide: (guide) => set({ guide }),
  setTravel: (travel) => set({ travel }),
  setCanvas: (canvas) => set({ canvas }),
}))

export function isInteractive(mode: RigMode, paused: boolean): boolean {
  return !paused && (mode === 'counter' || mode === 'focus' || mode === 'free')
}
