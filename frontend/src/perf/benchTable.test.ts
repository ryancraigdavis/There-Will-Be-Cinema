import { describe, expect, it } from 'vitest'
import { benchRows, compareRows, formatTable, METRICS } from './benchTable'
import { createRecorder } from './recorder'

function run(tests: number, mipgen: number) {
  const perf = createRecorder()
  perf.count('raycast.tests', tests)
  perf.count('gl.generateMipmap', mipgen)
  perf.gauge('draws', 210)
  perf.endFrame(16)
  perf.endFrame(60)
  return perf.report()
}

const column = (name: string) => METRICS.findIndex((metric) => metric.header === name) + 1

describe('bench table', () => {
  it('has one row per segment under a header', () => {
    const rows = benchRows(run(500, 2))
    expect(rows).toHaveLength(2)
    expect(rows[0]?.[0]).toBe('segment')
    expect(rows[1]?.[0]).toBe('load')
  })

  it.each([
    ['frames', '2'],
    ['maxms', '60.0'],
    ['hitch', '1'],
    ['draws', '210'],
    ['tests/f', '250'],
    ['mipgen', '2'],
    ['upl', '0'],
  ])('reports %s', (header, expected) => {
    expect(benchRows(run(500, 2))[1]?.[column(header)]).toBe(expected)
  })

  it('shows only what changed between two runs', () => {
    const rows = compareRows(run(500, 2), run(40, 2))
    expect(rows[1]?.[column('tests/f')]).toBe('250>20')
    expect(rows[1]?.[column('mipgen')]).toBe('2')
    expect(rows[0]?.[column('mipgen')]).toBe('mipgen')
  })

  it('keeps a segment the earlier run never had', () => {
    const after = createRecorder('extra')
    after.endFrame(16)
    expect(compareRows(run(1, 1), after.report())[1]?.[0]).toBe('extra')
  })

  it('pads columns to line up', () => {
    expect(
      formatTable([
        ['segment', 'x'],
        ['a', '1000'],
      ]),
    ).toBe('segment  x   \na        1000')
  })
})
