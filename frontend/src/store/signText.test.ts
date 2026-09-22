import { describe, expect, it } from 'vitest'
import { bannerSpecs, rodLength, signSpec, storeTextSpecs } from './signText'

const sign = {
  id: 'bay-1',
  label: 'Horror A–C',
  position: [1, 2.12, -3] as const,
  yaw: 1.5708,
  size: 0.1,
  maxWidth: 0.9,
}
const banner = {
  id: 'aisle-3',
  label: 'Aisle 3',
  genres: ['Action'],
  position: [0, 2.5, -1.05] as const,
}

describe('sign text', () => {
  it('maps a bay sign to an upper-case centred member', () => {
    expect(signSpec(sign)).toMatchObject({
      id: 'sign:bay-1',
      text: 'HORROR A–C',
      fontSize: 0.1,
      maxWidth: 0.9,
      position: [1, 2.12, -3],
      yaw: 1.5708,
      anchorX: 'center',
      anchorY: 'middle',
    })
  })

  it.each([
    ['front label', 0, 'AISLE 3', [0, 2.6, -1.019], 0],
    ['front genres', 1, 'ACTION', [0, 2.41, -1.019], 0],
    ['back label', 2, 'AISLE 3', [0, 2.6, -1.081], Math.PI],
    ['back genres', 3, 'ACTION', [0, 2.41, -1.081], Math.PI],
  ])('places the %s', (_name, i, text, position, yaw) => {
    const spec = bannerSpecs(banner)[i]
    expect(spec?.text).toBe(text)
    expect(spec?.yaw).toBe(yaw)
    expect(spec?.position.map((v) => Math.round(v * 1000) / 1000)).toEqual(position)
  })

  it('joins genres with a dot and caps the width', () => {
    const [, genres] = bannerSpecs({ ...banner, genres: ['Drama', 'Comedy'] })
    expect(genres?.text).toBe('DRAMA · COMEDY')
    expect(genres?.maxWidth).toBeCloseTo(1.9)
  })

  it('hangs rods from the ceiling to the banner top', () => {
    expect(rodLength(2.5)).toBeCloseTo(0.29)
  })

  it('collects every store text into one list', () => {
    expect(storeTextSpecs([sign], [banner]).map((spec) => spec.id)).toEqual([
      'sign:bay-1',
      'banner:aisle-3:0.031:label',
      'banner:aisle-3:0.031:genres',
      'banner:aisle-3:-0.031:label',
      'banner:aisle-3:-0.031:genres',
    ])
  })
})
