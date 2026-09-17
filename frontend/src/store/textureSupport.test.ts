import { describe, expect, it } from 'vitest'
import { bitmapsSupported } from './textureSupport'

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'
const SAFARI = (version: number) =>
  `Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Safari/605.1.15`
const FIREFOX = (version: number) =>
  `Mozilla/5.0 (X11; Linux x86_64; rv:${version}.0) Gecko/20100101 Firefox/${version}.0`
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36'

describe('bitmapsSupported', () => {
  it.each([
    ['Chrome', CHROME, true, true],
    ['Android Chrome', ANDROID_CHROME, true, true],
    ['Safari 17', SAFARI(17), true, true],
    ['Safari 16', SAFARI(16), true, false],
    ['Firefox 130', FIREFOX(130), true, true],
    ['Firefox 90', FIREFOX(90), true, false],
    ['no createImageBitmap', CHROME, false, false],
  ])('%s', (_name, agent, available, expected) => {
    expect(bitmapsSupported(agent, available)).toBe(expected)
  })
})
