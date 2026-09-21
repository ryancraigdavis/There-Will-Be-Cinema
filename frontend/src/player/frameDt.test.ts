import { describe, expect, it } from 'vitest'
import { frameDt } from './frameDt'

describe('frameDt', () => {
  it.each([
    ['follows the clock normally', 0.021, null, 0.021],
    ['uses the fixed step when one is set', 0.3, 16.7, 0.0167],
  ])('%s', (_name, delta, fixed, expected) => {
    expect(frameDt(delta, fixed)).toBeCloseTo(expected, 6)
  })
})
