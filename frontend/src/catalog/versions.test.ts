import { describe, expect, it } from 'vitest'
import { toItem } from '../api'
import { rawItem } from '../test/fixtures'
import {
  formatSize,
  groupFilms,
  resolutionLabel,
  runtimesDiffer,
  versionKey,
  versionLabel,
} from './versions'

const uhd = toItem(
  rawItem({
    id: 'uhd',
    ti: 'Dune',
    st: 'dune',
    y: 2021,
    imdb: 'tt1',
    w: 3840,
    k4: true,
    hdr: 'HDR10',
    at: true,
    sz: 64 * 1024 ** 3,
    ac: 'TrueHD 7.1',
  }),
)
const hd = toItem(
  rawItem({
    id: 'hd',
    ti: 'Dune',
    st: 'dune',
    y: 2021,
    imdb: 'tt1',
    w: 1920,
    hdr: 'SDR',
    sz: 8 * 1024 ** 3,
    ac: 'AAC stereo',
    rt: 155,
  }),
)
const other = toItem(
  rawItem({ id: 'other', ti: 'Alien', st: 'alien', y: 1979, imdb: 'tt2', w: 1920 }),
)

describe('version grouping', () => {
  it.each([
    ['imdb id wins', rawItem({ id: 'a', imdb: 'tt9', tmdb: '5', ti: 'X' }), 'tt9'],
    ['then tmdb id', rawItem({ id: 'b', imdb: null, tmdb: '5' }), '5'],
    [
      'then title and year',
      rawItem({ id: 'c', imdb: null, tmdb: null, st: 'the thing', y: 1982 }),
      'the thing|1982',
    ],
  ])('%s', (_name, raw, expected) => {
    expect(versionKey(toItem(raw))).toBe(expected)
  })

  it('keeps one film per group, best version first', () => {
    const films = groupFilms([hd, uhd, other])
    expect(films.map((film) => film.versions.map((v) => v.id))).toEqual([['uhd', 'hd'], ['other']])
    expect(films[0]?.item.versionCount).toBe(2)
  })

  it('merges format badges across versions', () => {
    const [dune] = groupFilms([hd, uhd])
    expect(dune?.item).toMatchObject({ id: 'uhd', is4k: true, hdr: 'HDR10', atmos: true })
  })

  it('keeps single films untouched', () => {
    const [alien] = groupFilms([other])
    expect(alien?.item.versionCount).toBe(1)
    expect(alien?.versions).toHaveLength(1)
  })
})

describe('version labels', () => {
  it.each([
    [3840, '4K'],
    [1920, '1080p'],
    [1280, '720p'],
    [720, 'SD'],
    [null, 'SD'],
  ])('resolution for width %s', (width, expected) => {
    expect(resolutionLabel(toItem(rawItem({ w: width })))).toBe(expected)
  })

  it('names a version by picture, and by runtime when they differ', () => {
    expect(versionLabel(uhd)).toBe('4K · HDR10')
    expect(versionLabel(hd, true)).toBe('1080p · 2h 35m')
  })

  it.each([
    [64 * 1024 ** 3, '64 GB'],
    [8 * 1024 ** 3, '8.0 GB'],
    [null, null],
  ])('formatSize(%s)', (bytes, expected) => {
    expect(formatSize(bytes)).toBe(expected)
  })

  it('spots differing runtimes', () => {
    expect(runtimesDiffer([uhd, hd])).toBe(true)
    expect(runtimesDiffer([uhd, uhd])).toBe(false)
  })
})
