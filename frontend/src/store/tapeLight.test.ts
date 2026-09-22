import { describe, expect, it } from 'vitest'
import type { LightRig } from '../theme/lightRig'
import { bakeLight, coverNormal, distanceAttenuation, irradiance, linearRgb } from './tapeLight'

const dark: LightRig = {
  hemisphere: { sky: '#000000', ground: '#000000', intensity: 0 },
  ambient: { color: '#000000', intensity: 0 },
  directional: { position: [0, 1, 0], intensity: 0, color: '#000000' },
  points: [],
}
const white = '#ffffff'

describe('tape light', () => {
  it.each([
    ['black', '#000000', [0, 0, 0]],
    ['white', '#ffffff', [1, 1, 1]],
    ['mid grey is darker in linear light', '#808080', [0.2159, 0.2159, 0.2159]],
  ])('%s', (_name, hex, expected) => {
    expect(linearRgb(hex).map((v) => Math.round(v * 1e4) / 1e4)).toEqual(expected)
  })

  it.each([
    ['facing +x', 0, [1, 0, 0]],
    ['facing +z', -Math.PI / 2, [0, 0, 1]],
    ['facing -x', Math.PI, [-1, 0, 0]],
  ])('cover normal %s', (_name, yaw, expected) => {
    expect(coverNormal(yaw).map((v) => Math.round(v * 1e6) / 1e6 + 0)).toEqual(expected)
  })

  it.each([
    ['at one metre with no cutoff', 1, 0, 2, 1],
    ['falls off with distance', 2, 0, 2, 0.25],
    ['is windowed to zero at the cutoff', 8, 8, 2, 0],
    ['is halfway inside the window', 4, 8, 1, 0.25 * (1 - 1 / 16) ** 2],
  ])('%s', (_name, distance, cutoff, decay, expected) => {
    expect(distanceAttenuation(distance, cutoff, decay)).toBeCloseTo(expected, 6)
  })

  it('adds ambient, a sky-weighted hemisphere and a facing sun', () => {
    const rig: LightRig = {
      ...dark,
      ambient: { color: white, intensity: 0.5 },
      hemisphere: { sky: white, ground: '#000000', intensity: 1 },
      directional: { position: [0, 0, 1], intensity: 2, color: white },
    }
    expect(irradiance([0, 0, 0], [0, 0, 1], rig)[0]).toBeCloseTo(0.5 + 0.5 + 2, 6)
    expect(irradiance([0, 0, 0], [0, 0, -1], rig)[0]).toBeCloseTo(0.5 + 0.5, 6)
    expect(irradiance([0, 0, 0], [0, 1, 0], rig)[0]).toBeCloseTo(0.5 + 1, 6)
  })

  it('lights a cover that faces a point light and not one turned away', () => {
    const rig: LightRig = {
      ...dark,
      points: [{ position: [0, 0, 2], intensity: 4, distance: 0, decay: 2, color: white }],
    }
    expect(irradiance([0, 0, 0], [0, 0, 1], rig)[0]).toBeCloseTo(1, 6)
    expect(irradiance([0, 0, 0], [0, 0, -1], rig)[0]).toBe(0)
  })

  it('divides by pi like a Lambert surface', () => {
    const rig: LightRig = { ...dark, ambient: { color: white, intensity: Math.PI } }
    expect(bakeLight([0, 0, 0], [1, 0, 0], rig)[1]).toBeCloseTo(1, 6)
  })
})
