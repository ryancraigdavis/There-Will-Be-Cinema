export type FrameKind = 'ok' | 'slow' | 'hitch' | 'freeze'

export interface FrameStats {
  samples: Float32Array
  count: number
}

export interface Summary {
  frames: number
  mean: number
  p50: number
  p95: number
  p99: number
  max: number
  slow: number
  hitch: number
  freeze: number
}

const KINDS: readonly { kind: FrameKind; over: number }[] = [
  { kind: 'freeze', over: 100 },
  { kind: 'hitch', over: 50 },
  { kind: 'slow', over: 25 },
]

export function classify(ms: number): FrameKind {
  return KINDS.find(({ over }) => ms > over)?.kind ?? 'ok'
}

export function createFrameStats(capacity = 600): FrameStats {
  return { samples: new Float32Array(capacity), count: 0 }
}

export function pushFrame(stats: FrameStats, ms: number): void {
  stats.samples[stats.count % stats.samples.length] = ms
  stats.count += 1
}

export function recent(stats: FrameStats): number[] {
  return Array.from(stats.samples.subarray(0, Math.min(stats.count, stats.samples.length)))
}

export function percentile(sorted: readonly number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0
}

function over(samples: readonly number[], kind: FrameKind): number {
  return samples.filter((ms) => classify(ms) === kind).length
}

export function summarize(samples: readonly number[]): Summary {
  const sorted = [...samples].sort((a, b) => a - b)
  const total = sorted.reduce((sum, ms) => sum + ms, 0)
  return {
    frames: sorted.length,
    mean: total / Math.max(1, sorted.length),
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    max: sorted.at(-1) ?? 0,
    slow: over(sorted, 'slow'),
    hitch: over(sorted, 'hitch'),
    freeze: over(sorted, 'freeze'),
  }
}
