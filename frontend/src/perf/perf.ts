import { benchRequested, fixedStepMs, type PerfMode, perfMode } from './mode'
import { createRecorder, idleRecorder, type Recorder, type Report, type Snapshot } from './recorder'

declare global {
  interface Window {
    __perf?: { report: () => Report; snapshot: () => Snapshot; benchDone: boolean }
  }
}

const SEARCH = typeof location === 'undefined' ? '' : location.search
const RECORDERS: Record<PerfMode, () => Recorder> = {
  off: () => idleRecorder,
  on: createRecorder,
  sync: createRecorder,
}

export const PERF_MODE = perfMode(SEARCH)
export const PERF_ON = PERF_MODE !== 'off'
export const BENCH = benchRequested(SEARCH)
export const FIXED_STEP_MS = fixedStepMs(SEARCH)
export const perf: Recorder = RECORDERS[PERF_MODE]()

if (PERF_ON) {
  window.__perf = { report: perf.report, snapshot: perf.snapshot, benchDone: false }
}

export function timed<T>(label: string, run: () => T, bytes = 0): T {
  const start = performance.now()
  const result = run()
  perf.event(label, performance.now() - start, bytes)
  return result
}
