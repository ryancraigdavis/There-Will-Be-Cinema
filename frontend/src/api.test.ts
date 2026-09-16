import { describe, expect, it } from 'vitest'
import { atlasUrl, embyHomeUrl, embyItemUrl, errorDetail, posterUrl, toItem, toSite } from './api'
import { catalogFixture, rawItem } from './test/fixtures'

const site = toSite({
  emby_url: 'https://emby.example.com',
  emby_server_id: 'srv1',
  club_url: 'https://club.example.com',
})

describe('api helpers', () => {
  it('maps compact catalog rows', () => {
    const catalog = catalogFixture()
    const twbb = catalog.byId.get('twbb')
    expect(catalog.atlasVersion).toBe('v1')
    expect(twbb).toMatchObject({
      title: 'There Will Be Blood',
      year: 2007,
      hdr: 'Dolby Vision',
      dvProfile: '7.6',
      atmos: true,
      genres: ['Drama', 'History'],
    })
  })

  it('builds Emby links with and without a server id', () => {
    expect(embyHomeUrl(site)).toBe('https://emby.example.com/web/index.html')
    expect(embyItemUrl(site, 'abc')).toBe(
      'https://emby.example.com/web/index.html#!/item?id=abc&serverId=srv1',
    )
    expect(embyItemUrl({ ...site, embyServerId: null }, 'abc')).toBe(
      'https://emby.example.com/web/index.html#!/item?id=abc',
    )
  })

  it('cleans genres and picks a shelf genre', () => {
    const item = toItem(rawItem({ g: ['TV Movie', 'Sci-Fi', 'Science Fiction'], pg: 'TV Movie' }))
    expect(item.genres).toEqual(['TV Movie', 'Science Fiction'])
    expect(item.primaryGenre).toBe('Science Fiction')
  })

  it('builds atlas urls per level', () => {
    const index = {
      cell: [128, 192] as [number, number],
      size: 4096,
      cols: 32,
      rows: 21,
      version: 'v9',
      count: 1,
      slots: {},
    }
    expect(atlasUrl(index, 2)).toBe('/api/atlases/2.webp?v=v9')
    expect(atlasUrl(index, 2, 1024)).toBe('/api/atlases/2-1024.webp?v=v9')
  })

  it('versions poster urls by image tag', () => {
    expect(posterUrl({ id: '42', imageTag: 't9' })).toBe('/api/posters/42.webp?v=t9')
  })
})

describe('errorDetail', () => {
  it.each([
    ['a plain detail', { detail: 'invalid username or password' }, 'invalid username or password'],
    [
      'the first validation message',
      { detail: [{ msg: 'field required' }, { msg: 'x' }] },
      'field required',
    ],
    ['a fallback for an empty body', null, 'request failed (502)'],
    ['a fallback for an odd detail', { detail: 42 }, 'request failed (502)'],
  ])('reads %s', (_name, body, expected) => {
    expect(errorDetail(body, 502)).toBe(expected)
  })
})
