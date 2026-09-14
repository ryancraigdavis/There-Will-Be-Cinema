import { describe, expect, it } from 'vitest'
import { toItem } from '../api'
import type { Collection } from '../catalog/types'
import { rawItem } from '../test/fixtures'
import { ROOM } from './constants'
import { buildDisplays, endcapCollections, newestMovies, seriesByTitle } from './displays'
import { slotCapacity, TV_SPEC } from './runs'

const movie = (id: string, addedAt: string) => toItem(rawItem({ id, ti: id, st: id, dc: addedAt }))
const show = (id: string) => toItem(rawItem({ id, t: 'Series', ti: id, st: id }))

const items = [
  movie('old', '2020-01-01'),
  movie('newest', '2026-09-01'),
  movie('middle', '2024-05-01'),
  show('zorro'),
  show('alf'),
]

const collection = (id: string, itemIds: string[]): Collection => ({
  id,
  name: id,
  overview: null,
  imageTag: null,
  itemIds,
})

describe('selections', () => {
  it('orders new releases by date added and skips series', () => {
    expect(newestMovies(items, 2)).toEqual(['newest', 'middle'])
  })

  it('shelves series alphabetically', () => {
    expect(seriesByTitle(items)).toEqual(['alf', 'zorro'])
  })

  it('picks the biggest collections that have enough titles on hand', () => {
    const known = new Set(['a', 'b', 'c', 'd', 'e'])
    const picked = endcapCollections(
      [
        collection('small', ['a', 'b']),
        collection('big', ['a', 'b', 'c', 'd', 'e']),
        collection('mostly-missing', ['a', 'x', 'y', 'z', 'q']),
        collection('four', ['a', 'b', 'c', 'd']),
      ],
      known,
    )
    expect(picked.map((c) => [c.id, c.itemIds.length])).toEqual([
      ['big', 5],
      ['four', 4],
    ])
  })
})

describe('displays', () => {
  const plan = buildDisplays(items, [collection('Staff Picks', ['old', 'newest', 'middle', 'alf'])])
  const slotsOf = (runId: string) =>
    plan.sections.filter((section) => section.run.id === runId).flatMap((section) => section.slots)

  it('lines the right lobby wall with new releases facing into the room', () => {
    const slots = slotsOf('new-releases')
    expect(slots.map((slot) => slot.itemId)).toEqual(['newest', 'middle', 'old'])
    expect(slots[0]?.position[0]).toBeLessThan(ROOM.maxX)
    expect(slots[0]?.position[0]).toBeGreaterThan(ROOM.maxX - 0.1)
    expect(Math.abs(slots[0]?.yaw ?? 0)).toBeCloseTo(Math.PI)
  })

  it('reads left to right along the back wall for TV', () => {
    const [a, b] = slotsOf('tv')
    expect([a?.itemId, b?.itemId]).toEqual(['alf', 'zorro'])
    expect(b?.position[0]).toBeGreaterThan(a?.position[0] ?? 0)
    expect(a?.yaw).toBeCloseTo(-Math.PI / 2)
    expect(a?.position[2]).toBeGreaterThan(ROOM.minZ)
  })

  it('signs each display, endcaps with the collection name', () => {
    expect(plan.signs.map((sign) => sign.label)).toEqual([
      'New Releases',
      'TV on DVD',
      'Staff Picks',
    ])
    expect(slotsOf('endcap-0-front')).toHaveLength(4)
  })

  it('reports TV shows that do not fit', () => {
    const count = slotCapacity(TV_SPEC) + 3
    const many = Array.from({ length: count }, (_, i) => show(`show-${String(i).padStart(4, '0')}`))
    expect(buildDisplays(many, []).overflow).toHaveLength(3)
  })
})
