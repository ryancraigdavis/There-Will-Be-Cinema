import { describe, expect, it } from 'vitest'
import type { Screening } from '../club/types'
import { cardFor, filmTitle } from './cards'

const screening: Screening = {
  id: 1,
  title: 'There Will Be Blood',
  year: 2007,
  startsAt: new Date(2026, 8, 18, 19, 30).toISOString(),
  location: 'Living room',
  message: 'Bring milkshakes',
  description: null,
  itemId: 'twbb',
  posterUrl: null,
  runtimeMin: 158,
}

describe('cardFor', () => {
  it('pins the next screening to the bulletin card', () => {
    const card = cardFor('bulletin', screening, new Date(2026, 8, 18, 12))
    expect(card).toMatchObject({ kicker: 'Next screening', title: 'There Will Be Blood (2007)' })
    expect(card.body.split('\n')).toEqual(['Tonight · 7:30 PM', 'Living room', 'Bring milkshakes'])
  })

  it('says so when nothing is scheduled', () => {
    expect(cardFor('bulletin', null, new Date()).title).toBe('Nothing on the schedule yet')
  })

  it.each(['suggestion', 'telephone'] as const)('keeps the %s card in place', (id) => {
    const card = cardFor(id, screening, new Date())
    expect(card.body).not.toMatch(/club site/)
    expect(card.width).toBeGreaterThan(0)
  })
})

it.each([
  [{ title: 'Magnolia', year: 1999 }, 'Magnolia (1999)'],
  [{ title: 'Untitled', year: null }, 'Untitled'],
])('filmTitle %#', (value, expected) => {
  expect(filmTitle(value)).toBe(expected)
})
