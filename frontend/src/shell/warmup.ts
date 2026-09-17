import { create } from 'zustand'

interface WarmupState {
  glyphs: boolean
  atlases: boolean
  shaders: boolean
  mark: (patch: Partial<Pick<WarmupState, 'glyphs' | 'atlases' | 'shaders'>>) => void
}

export const useWarmup = create<WarmupState>((set) => ({
  glyphs: false,
  atlases: false,
  shaders: false,
  mark: (patch) => set(patch),
}))

export function warmedUp(state: Pick<WarmupState, 'glyphs' | 'atlases' | 'shaders'>): boolean {
  return state.glyphs && state.atlases && state.shaders
}

export function warmLevel(levels: readonly number[], maxSize: number): number | null {
  const usable = levels.filter((size) => size <= maxSize)
  const preferred = maxSize >= 4096 ? 2048 : 1024
  return usable.includes(preferred) ? preferred : (usable[0] ?? null)
}
