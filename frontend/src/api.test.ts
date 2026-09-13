import { describe, expect, it } from 'vitest'
import { embyHomeUrl, embyItemUrl, posterUrl, toSite } from './api'
import { catalogFixture } from './test/fixtures'

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

  it('versions poster urls by image tag', () => {
    expect(posterUrl({ id: '42', imageTag: 't9' })).toBe('/api/posters/42.webp?v=t9')
  })
})
