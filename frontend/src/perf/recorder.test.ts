import { describe, expect, it } from 'vitest'
import { createRecorder, idleRecorder, LOG_LIMIT } from './recorder'

describe('recorder', () => {
  it('zeroes counters each frame and totals them per segment', () => {
    const perf = createRecorder()
    perf.count('raycast.tests', 40)
    expect(perf.peek('raycast.tests')).toBe(40)
    perf.endFrame(16)
    expect(perf.peek('raycast.tests')).toBe(0)
    perf.count('raycast.tests', 2)
    perf.endFrame(16)
    perf.mark('walk')
    perf.count('raycast.tests', 5)
    perf.endFrame(16)
    const [load, walk] = perf.report().segments
    expect(load).toMatchObject({ label: 'load', frames: 2, counters: { 'raycast.tests': 42 } })
    expect(walk).toMatchObject({ label: 'walk', frames: 1, counters: { 'raycast.tests': 5 } })
    expect(perf.report().totals).toEqual({ 'raycast.tests': 47 })
  })

  it('logs a long frame with its own events and the previous frame’s', () => {
    const perf = createRecorder()
    perf.event('upload 3.webp 4/9', 2, 8)
    perf.endFrame(16)
    perf.event('fetch+decode 4.webp', 30)
    perf.count('upload.steps')
    perf.endFrame(70, 1234)
    perf.endFrame(16)
    expect(perf.report().long).toEqual([
      {
        frame: 1,
        at: 1234,
        ms: 70,
        kind: 'hitch',
        segment: 'load',
        counters: { 'upload.steps': 1 },
        events: [
          { label: 'upload 3.webp 4/9', ms: 2, bytes: 8 },
          { label: 'fetch+decode 4.webp', ms: 30, bytes: 0 },
        ],
      },
    ])
  })

  it('tracks gauge peaks per segment and where each segment ended', () => {
    const perf = createRecorder()
    perf.adjust('decode.inflight', 1)
    perf.adjust('decode.inflight', 1)
    perf.adjust('decode.inflight', -2)
    perf.gauge('tex.mb', 134)
    perf.mark('walk')
    perf.gauge('tex.mb', 90)
    const [load, walk] = perf.report().segments
    expect(load).toMatchObject({
      peaks: { 'decode.inflight': 2, 'tex.mb': 134 },
      end: { 'decode.inflight': 0, 'tex.mb': 134 },
    })
    expect(walk).toMatchObject({ peaks: { 'tex.mb': 134 }, end: { 'tex.mb': 90 } })
  })

  it('keeps the worst long frames and notes, and shows the latest few', () => {
    const perf = createRecorder()
    perf.endFrame(900)
    for (let i = 0; i < LOG_LIMIT + 20; i++) {
      perf.endFrame(60 + i)
      perf.note('longtask', i, 60 + i)
    }
    const report = perf.report()
    expect(report.long).toHaveLength(LOG_LIMIT)
    expect(report.long[0]).toMatchObject({ frame: 0, ms: 900 })
    expect(report.long.at(-1)?.ms).toBe(81)
    expect(report.notes).toHaveLength(LOG_LIMIT)
    expect(report.notes.at(-1)?.ms).toBe(80)
    expect(perf.snapshot().long.map((entry) => entry.frame)).toEqual([216, 217, 218, 219, 220])
  })

  it('does nothing when idle', () => {
    idleRecorder.count('x')
    idleRecorder.endFrame(500)
    expect(idleRecorder.peek('x')).toBe(0)
    expect(idleRecorder.report().segments).toEqual([])
    expect(idleRecorder.snapshot().frame).toBe(0)
  })
})
