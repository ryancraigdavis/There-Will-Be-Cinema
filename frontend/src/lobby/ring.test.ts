import { describe, expect, it } from 'vitest'
import { ringShake } from './Fixtures'

describe('ringShake', () => {
  it('sits still before anything happens', () => {
    expect(ringShake(0)).toEqual({ lift: 0, tilt: 0, sway: 0 })
  })

  it('rings, pauses, then rings again', () => {
    const during = (from: number, to: number) => {
      let peak = 0
      for (let t = from; t < to; t += 0.01) {
        peak = Math.max(peak, ringShake(t).lift)
      }
      return peak
    }
    expect(during(0, 0.55)).toBeGreaterThan(0.008)
    expect(during(0.57, 0.79)).toBe(0)
    expect(during(0.81, 1.35)).toBeGreaterThan(0.001)
  })

  it('fades out instead of stopping dead', () => {
    const first = ringShake(0.2).lift
    const second = ringShake(1.0).lift
    expect(second).toBeLessThan(first)
    expect(ringShake(1.8)).toEqual({ lift: 0, tilt: 0, sway: 0 })
  })

  it('never leaves the cradle', () => {
    for (let t = 0; t <= 2.5; t += 0.005) {
      const { lift, tilt, sway } = ringShake(t)
      expect(lift).toBeGreaterThanOrEqual(0)
      expect(lift).toBeLessThanOrEqual(0.023)
      expect(Math.abs(tilt)).toBeLessThanOrEqual(0.28)
      expect(Math.abs(sway)).toBeLessThanOrEqual(0.008)
    }
  })
})
