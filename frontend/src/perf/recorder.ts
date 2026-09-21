import {
  classify,
  createFrameStats,
  type FrameKind,
  pushFrame,
  recent,
  type Summary,
  summarize,
} from './frameStats'

export type Counters = Record<string, number>

export interface PerfEvent {
  label: string
  ms: number
  bytes: number
}

export interface PerfNote {
  label: string
  at: number
  ms: number
}

export interface LongFrame {
  frame: number
  at: number
  ms: number
  kind: FrameKind
  segment: string
  counters: Counters
  events: PerfEvent[]
}

export interface SegmentReport extends Summary {
  label: string
  counters: Counters
  peaks: Counters
  end: Counters
}

export interface Report {
  segments: SegmentReport[]
  long: LongFrame[]
  notes: PerfNote[]
  totals: Counters
  gauges: Counters
}

export interface Snapshot {
  frame: number
  recent: Summary
  totals: Counters
  gauges: Counters
  long: LongFrame[]
}

export interface Recorder {
  count: (name: string, by?: number) => void
  peek: (name: string) => number
  gauge: (name: string, value: number) => void
  adjust: (name: string, by: number) => void
  event: (label: string, ms: number, bytes?: number) => void
  note: (label: string, at: number, ms: number) => void
  mark: (label: string) => void
  endFrame: (ms: number, at?: number) => void
  snapshot: () => Snapshot
  report: () => Report
}

interface Frame {
  counters: Counters
  events: PerfEvent[]
}

interface Segment {
  label: string
  frames: number[]
  counters: Counters
  peaks: Counters
  end: Counters
}

export const LOG_LIMIT = 200
const SHOWN_LONG = 5

const emptyFrame = (): Frame => ({ counters: {}, events: [] })

function addInto(target: Counters, source: Counters) {
  for (const [name, value] of Object.entries(source)) {
    target[name] = (target[name] ?? 0) + value
  }
}

function worst<T extends { ms: number }>(log: T[], entry: T): T[] {
  return [...log, entry].sort((a, b) => b.ms - a.ms).slice(0, LOG_LIMIT)
}

function segmentReport({ label, frames, counters, peaks, end }: Segment): SegmentReport {
  return { label, ...summarize(frames), counters, peaks, end }
}

export function createRecorder(first = 'load'): Recorder {
  const stats = createFrameStats()
  const gauges: Counters = {}
  const totals: Counters = {}
  const open = (label: string): Segment => ({
    label,
    frames: [],
    counters: {},
    peaks: { ...gauges },
    end: {},
  })
  const segments: Segment[] = [open(first)]
  let frame = emptyFrame()
  let previous = emptyFrame()
  let index = 0
  let long: LongFrame[] = []
  let latest: LongFrame[] = []
  let notes: PerfNote[] = []

  const current = () => segments.at(-1) as Segment

  const gauge = (name: string, value: number) => {
    const peaks = current().peaks
    gauges[name] = value
    peaks[name] = Math.max(peaks[name] ?? value, value)
  }

  const logLong = (ms: number, at: number) => {
    const kind = classify(ms)
    const entry: LongFrame = {
      frame: index,
      at,
      ms,
      kind,
      segment: current().label,
      counters: frame.counters,
      events: [...previous.events, ...frame.events],
    }
    long = kind === 'ok' ? long : worst(long, entry)
    latest = kind === 'ok' ? latest : [...latest, entry].slice(-SHOWN_LONG)
  }

  return {
    count: (name, by = 1) => {
      frame.counters[name] = (frame.counters[name] ?? 0) + by
    },
    peek: (name) => frame.counters[name] ?? 0,
    gauge,
    adjust: (name, by) => gauge(name, (gauges[name] ?? 0) + by),
    event: (label, ms, bytes = 0) => {
      frame.events.push({ label, ms, bytes })
    },
    note: (label, at, ms) => {
      notes = worst(notes, { label, at, ms })
    },
    mark: (label) => {
      current().end = { ...gauges }
      segments.push(open(label))
    },
    endFrame: (ms, at = 0) => {
      pushFrame(stats, ms)
      current().frames.push(ms)
      addInto(current().counters, frame.counters)
      addInto(totals, frame.counters)
      logLong(ms, at)
      previous = frame
      frame = emptyFrame()
      index += 1
    },
    snapshot: () => ({
      frame: index,
      recent: summarize(recent(stats)),
      totals: { ...totals },
      gauges: { ...gauges },
      long: latest,
    }),
    report: () => ({
      segments: segments.map((segment, i) =>
        segmentReport(i === segments.length - 1 ? { ...segment, end: { ...gauges } } : segment),
      ),
      long,
      notes,
      totals: { ...totals },
      gauges: { ...gauges },
    }),
  }
}

const EMPTY_SUMMARY = summarize([])

export const idleRecorder: Recorder = {
  count: () => undefined,
  peek: () => 0,
  gauge: () => undefined,
  adjust: () => undefined,
  event: () => undefined,
  note: () => undefined,
  mark: () => undefined,
  endFrame: () => undefined,
  snapshot: () => ({ frame: 0, recent: EMPTY_SUMMARY, totals: {}, gauges: {}, long: [] }),
  report: () => ({ segments: [], long: [], notes: [], totals: {}, gauges: {} }),
}
