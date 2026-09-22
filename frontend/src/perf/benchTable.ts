import type { Report, SegmentReport } from './recorder'

interface Metric {
  header: string
  value: (segment: SegmentReport) => number
  digits?: number
}

const total = (name: string) => (segment: SegmentReport) => segment.counters[name] ?? 0
const peak = (name: string) => (segment: SegmentReport) => segment.peaks[name] ?? 0
const perFrame = (name: string) => (segment: SegmentReport) =>
  total(name)(segment) / Math.max(1, segment.frames)

export const METRICS: readonly Metric[] = [
  { header: 'frames', value: (segment) => segment.frames },
  { header: 'p95ms', value: (segment) => segment.p95, digits: 1 },
  { header: 'maxms', value: (segment) => segment.max, digits: 1 },
  { header: 'slow', value: (segment) => segment.slow },
  { header: 'hitch', value: (segment) => segment.hitch },
  { header: 'freeze', value: (segment) => segment.freeze },
  { header: 'draws', value: peak('draws') },
  { header: 'rays/f', value: perFrame('raycast.passes'), digits: 2 },
  { header: 'tests/f', value: perFrame('raycast.tests'), digits: 0 },
  { header: 'pick/f', value: perFrame('pick.passes'), digits: 2 },
  { header: 'upl', value: total('upload.steps') },
  { header: 'upl4k-mv', value: total('upload.4096.moving') },
  { header: 'subImg', value: total('gl.texSubImage2D') },
  { header: 'mipgen', value: total('gl.generateMipmap') },
  { header: 'links', value: total('gl.linkProgram') },
  { header: 'decodes', value: total('decode.count') },
  { header: 'decoding', value: peak('decode.inflight') },
  { header: 'texMB', value: peak('tex.mb'), digits: 0 },
  { header: 'zustand', value: total('zustand.scene') },
  { header: 'batchR', value: total('render.BoxBatch') },
  { header: 'lod', value: total('lod.change') },
  { header: 'matrices', value: total('matrix.rewrite') },
]

function cell(metric: Metric, segment: SegmentReport): string {
  return metric.value(segment).toFixed(metric.digits ?? 0)
}

export function benchRows(report: Report): string[][] {
  const header = ['segment', ...METRICS.map((metric) => metric.header)]
  const rows = report.segments.map((segment) => [
    segment.label,
    ...METRICS.map((metric) => cell(metric, segment)),
  ])
  return [header, ...rows]
}

function merged(before: string | undefined, after: string): string {
  return before === undefined || before === after ? after : `${before}>${after}`
}

export function compareRows(before: Report, after: Report): string[][] {
  const old = new Map(benchRows(before).map((row) => [row[0], row]))
  return benchRows(after).map((row) =>
    row.map((value, column) => (column === 0 ? value : merged(old.get(row[0])?.[column], value))),
  )
}

export function formatTable(rows: readonly string[][]): string {
  const widths = (rows[0] ?? []).map((_, column) =>
    Math.max(...rows.map((row) => (row[column] ?? '').length)),
  )
  return rows
    .map((row) => row.map((value, column) => value.padEnd(widths[column] ?? 0)).join('  '))
    .join('\n')
}
