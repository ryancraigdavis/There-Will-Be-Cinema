import { describe, expect, it } from 'vitest'
import { inputFromKeys, isRunKey, MOVEMENT_KEYS, moveInput } from './keys'

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

describe('moveInput', () => {
  it.each([
    [[], { x: 0, y: -0.5 }, { forward: 0.5, strafe: 0, run: false }],
    [[], { x: 0.3, y: 0 }, { forward: 0, strafe: 0.3, run: false }],
    [['KeyW'], { x: 0, y: -1 }, { forward: 1, strafe: 0, run: true }],
    [['KeyA'], { x: 0.4, y: 0 }, { forward: 0, strafe: -0.6, run: false }],
  ])('keys %j with stick %j', (codes, stick, expected) => {
    const result = moveInput(new Set(codes), stick)
    expect(result.run).toBe(expected.run)
    expect(result.forward).toBeCloseTo(expected.forward)
    expect(result.strafe).toBeCloseTo(expected.strafe)
  })
})
