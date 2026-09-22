import { describe, expect, it } from 'vitest'
import {
  bandBytes,
  bandRects,
  flippedY,
  flipRows,
  isCancel,
  mipChain,
  pixelBands,
} from './decodeProtocol'

describe('decode protocol', () => {
  it.each([
    ['a 4096 sheet', 4096, 4096, 8, 512],
    ['a 2048 sheet', 2048, 2048, 4, 512],
    ['a poster stays whole', 400, 600, 1, 600],
    ['a 1024 sheet stays whole', 1024, 1024, 1, 1024],
    ['a short last band', 4096, 2100, 5, 52],
  ])('%s', (_name, width, height, count, lastHeight) => {
    const rects = bandRects(width, height)
    expect(rects).toHaveLength(count)
    expect(rects.at(-1)?.height).toBe(lastHeight)
    expect(rects.reduce((sum, band) => sum + band.height, 0)).toBe(height)
  })

  it('sizes each band in bytes', () => {
    expect(bandBytes(4096, 4096)).toEqual(Array(8).fill(4096 * 512 * 4))
    expect(bandBytes(400, 600)).toEqual([400 * 600 * 4])
  })

  it.each([
    [4096, 4096, 13],
    [2048, 2048, 12],
    [1, 1, 1],
    [400, 600, 10],
  ])('chains %ix%i down to 1x1 in %i levels', (width, height, levels) => {
    const chain = mipChain(width, height)
    expect(chain).toHaveLength(levels)
    expect(chain[0]).toEqual({ width, height })
    expect(chain.at(-1)).toEqual({ width: 1, height: 1 })
  })

  it('reverses the rows of a band', () => {
    const rows = [
      [1, 1, 1, 1, 2, 2, 2, 2],
      [3, 3, 3, 3, 4, 4, 4, 4],
      [5, 5, 5, 5, 6, 6, 6, 6],
    ]
    const flipped = flipRows(new Uint8ClampedArray(rows.flat()), 2)
    expect([...flipped]).toEqual([...(rows[2] ?? []), ...(rows[1] ?? []), ...(rows[0] ?? [])])
  })

  it.each([
    ['the top band lands at the bottom', 4096, { y: 0, height: 512 }, 3584],
    ['the bottom band lands at the top', 4096, { y: 3584, height: 512 }, 0],
    ['a short last band', 2100, { y: 2048, height: 52 }, 0],
    ['a whole image', 600, { y: 0, height: 600 }, 0],
  ])('%s', (_name, height, band, expected) => {
    expect(flippedY(height, band)).toBe(expected)
  })

  it('cuts a tall image into flipped bands and keeps a short one whole', () => {
    const width = 1
    const tall = new Uint8Array(4 * 2048).map((_, i) => Math.floor(i / 4) % 256)
    const bands = pixelBands(tall, width, 2048)
    expect(bands.map((band) => [band.y, band.height])).toEqual([
      [0, 512],
      [512, 512],
      [1024, 512],
      [1536, 512],
    ])
    expect(bands[0]?.data[0]).toBe(511 % 256)
    expect(bands[0]?.data.at(-4)).toBe(0)
    const short = pixelBands(
      new Uint8Array(4 * 3).map((_, i) => Math.floor(i / 4)),
      width,
      3,
    )
    expect(short).toHaveLength(1)
    expect([...(short[0]?.data ?? [])].filter((_, i) => i % 4 === 0)).toEqual([2, 1, 0])
  })

  it('tells a cancel from a request', () => {
    expect(isCancel({ id: 1, cancel: true })).toBe(true)
    expect(isCancel({ id: 1, url: 'x' })).toBe(false)
  })
})
