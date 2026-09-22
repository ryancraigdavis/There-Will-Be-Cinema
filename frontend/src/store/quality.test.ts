import { describe, expect, it } from 'vitest'
import { dprAfter, qualityFor } from './quality'

describe('quality tiers', () => {
  it.each([
    ['a desktop', { coarsePointer: false, maxTextureSize: 16384 }, 'desktop', 4096, 2, 1.75],
    ['a phone', { coarsePointer: true, maxTextureSize: 8192 }, 'mobile', 2048, 1, 1.5],
    [
      'a weak GPU caps the sheet size',
      { coarsePointer: false, maxTextureSize: 2048 },
      'desktop',
      2048,
      2,
      1.75,
    ],
  ])('%s', (_name, device, tier, maxAtlasSize, fullSheets, maxDpr) => {
    expect(qualityFor(device)).toMatchObject({ tier, maxAtlasSize, fullSheets, maxDpr })
  })

  it('drops to the fallback resolution only while frames run long', () => {
    const desktop = qualityFor({ coarsePointer: false, maxTextureSize: 16384 })
    expect(dprAfter(desktop, true)).toBe(1)
    expect(dprAfter(desktop, false)).toBe(1.75)
  })
})
