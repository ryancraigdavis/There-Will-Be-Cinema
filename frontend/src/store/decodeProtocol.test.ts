import { describe, expect, it } from 'vitest'
import { bandBytes, bandRects, isCancel, mipChain } from './decodeProtocol'

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

  it('tells a cancel from a request', () => {
    expect(isCancel({ id: 1, cancel: true })).toBe(true)
    expect(isCancel({ id: 1, url: 'x' })).toBe(false)
  })
})
