import { describe, expect, it } from 'vitest'
import { workerDecodeSupported } from './textureSupport'

describe('workerDecodeSupported', () => {
  it.each([
    ['workers and wasm', { worker: true, wasm: true }, true],
    ['no workers', { worker: false, wasm: true }, false],
    ['no wasm', { worker: true, wasm: false }, false],
  ])('%s', (_name, features, expected) => {
    expect(workerDecodeSupported(features)).toBe(expected)
  })
})
