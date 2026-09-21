import { describe, expect, it } from 'vitest'
import { benchRequested, fixedStepMs, levelKey, perfMode, textureMb, urlLabel } from './mode'

describe('perf mode', () => {
  it.each([
    ['no query', '', 'off'],
    ['unrelated query', '?tape=12', 'off'],
    ['perf=1', '?perf=1', 'on'],
    ['perf=on', '?perf=on', 'on'],
    ['perf=sync', '?tape=1&perf=sync', 'sync'],
    ['perf=0', '?perf=0', 'off'],
  ])('%s', (_name, search, expected) => {
    expect(perfMode(search)).toBe(expected)
  })

  it.each([
    ['bench with perf', '?perf=1&bench=1', true],
    ['bench without perf', '?bench=1', false],
    ['perf alone', '?perf=1', false],
  ])('bench: %s', (_name, search, expected) => {
    expect(benchRequested(search)).toBe(expected)
  })

  it.each([
    ['fixed step', '?perf=1&dt=16.7', 16.7],
    ['ignored without perf', '?dt=16.7', null],
    ['not a number', '?perf=1&dt=fast', null],
    ['zero', '?perf=1&dt=0', null],
    ['absurdly long', '?perf=1&dt=5000', null],
    ['absent', '?perf=1', null],
  ])('dt: %s', (_name, search, expected) => {
    expect(fixedStepMs(search)).toBe(expected)
  })

  it.each([
    ['an atlas level', '/api/atlases/3-2048.webp?v=abc', '3-2048.webp'],
    ['a poster', 'http://host/api/posters/991.webp', '991.webp'],
    ['a bare name', 'logo.webp', 'logo.webp'],
  ])('labels %s', (_name, url, expected) => {
    expect(urlLabel(url)).toBe(expected)
  })

  it.each([
    [4096, '4096'],
    [2048, '2048'],
    [1024, '1024'],
    [400, 'small'],
    [0, 'small'],
  ])('files a %i px texture under %s', (width, expected) => {
    expect(levelKey(width)).toBe(expected)
  })

  it.each([
    ['a 4096 sheet with mips', 4096, 4096, true, 85.33],
    ['a 2048 sheet with mips', 2048, 2048, true, 21.33],
    ['a 1024 sheet without mips', 1024, 1024, false, 4],
  ])('sizes %s', (_name, width, height, mipmaps, expected) => {
    expect(textureMb(width, height, mipmaps)).toBeCloseTo(expected, 1)
  })
})
