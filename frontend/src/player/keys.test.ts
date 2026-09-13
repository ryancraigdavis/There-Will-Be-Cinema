import { describe, expect, it } from 'vitest'
import { inputFromKeys, isRunKey, MOVEMENT_KEYS } from './keys'

describe('inputFromKeys', () => {
  it.each([
    [[], { forward: 0, strafe: 0, run: false }],
    [['KeyW'], { forward: 1, strafe: 0, run: false }],
    [['ArrowDown', 'KeyD'], { forward: -1, strafe: 1, run: false }],
    [['KeyW', 'KeyS', 'ShiftLeft'], { forward: 0, strafe: 0, run: true }],
    [['ArrowLeft', 'KeyA'], { forward: 0, strafe: -1, run: false }],
  ])('%j', (codes, expected) => {
    expect(inputFromKeys(new Set(codes))).toEqual(expected)
  })

  it('knows which keys move and which run', () => {
    expect(MOVEMENT_KEYS.has('KeyE')).toBe(false)
    expect(isRunKey('ShiftRight')).toBe(true)
  })
})
