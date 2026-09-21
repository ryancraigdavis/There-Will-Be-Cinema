import type { Counters, LongFrame, PerfEvent, Snapshot } from './recorder'

const LEVEL_KEYS = ['1024', '2048', '4096', 'small'] as const

export function perFrame(previous: Snapshot, next: Snapshot): Counters {
  const frames = Math.max(1, next.frame - previous.frame)
  return Object.fromEntries(
    Object.entries(next.totals).map(([name, value]) => [
      name,
      (value - (previous.totals[name] ?? 0)) / frames,
    ]),
  )
}

export function staleLevels(levels: readonly number[]): boolean {
  return levels.length > 0 && levels.every((size) => size >= 4096)
}

function worst(events: readonly PerfEvent[]): string {
  const slowest = [...events].sort((a, b) => b.ms - a.ms)[0]
  return slowest ? `${slowest.label} ${slowest.ms.toFixed(0)}ms` : 'nothing recorded'
}

export function longLine(entry: LongFrame): string {
  return `#${entry.frame} ${entry.ms.toFixed(0)}ms ${entry.segment}: ${worst(entry.events)}`
}

function residency(gauges: Counters): string {
  return LEVEL_KEYS.map((key) => `${key}:${(gauges[`tex.mb.${key}`] ?? 0).toFixed(0)}`).join(' ')
}

export function hudLines(snapshot: Snapshot, rate: Counters, levels: readonly number[]): string[] {
  const { recent, gauges } = snapshot
  const fixed = (value: number | undefined, digits = 0) => (value ?? 0).toFixed(digits)
  return [
    `fps ${fixed(1000 / Math.max(recent.mean, 0.001))}  p95 ${fixed(recent.p95, 1)}  p99 ${fixed(recent.p99, 1)}  max ${fixed(recent.max)}`,
    `slow ${recent.slow}  hitch ${recent.hitch}  freeze ${recent.freeze}  cpu ${fixed(rate['cpu.ms'], 1)}  gpu ${fixed(gauges['gpu.ms'], 1)}`,
    `draws ${fixed(gauges.draws)}  tris ${fixed(gauges.triangles)}  tex ${fixed(gauges.textures)}  programs ${fixed(gauges.programs)}`,
    `MB ${residency(gauges)}  total ${fixed(gauges['tex.mb'])}`,
    `queue ${fixed(gauges['upload.queue'])}  decoding ${fixed(gauges['decode.inflight'])}`,
    `rays/f ${fixed(rate['raycast.passes'], 2)}  tests/f ${fixed(rate['raycast.tests'])}  zustand/f ${fixed(rate['zustand.scene'], 2)}`,
    `levels ${levels.join(' ') || 'none'}${staleLevels(levels) ? '  STALE INDEX: 4096 only' : ''}`,
    ...snapshot.long.map(longLine),
  ]
}
