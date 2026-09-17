import { describe, expect, it } from 'vitest'
import type { Poll, Screening } from '../club/types'
import { buttonRow, cardActions, cardFor, filmTitle } from './cards'

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

const poll: Poll = {
  id: 1,
  question: 'October: pick the PTA film',
  status: 'open',
  options: [],
  totalVotes: null,
  myVote: null,
}

describe('with a poll open', () => {
  it.each([
    [true, ['vote', 'rsvp', 'back']],
    [false, ['vote', 'club', 'back']],
  ] as const)('bulletin actions with a screening: %s', (scheduled, expected) => {
    expect(cardActions('bulletin', scheduled ? screening : null, poll)).toEqual(expected)
  })

  it('puts the question on the card when nothing is scheduled', () => {
    expect(cardFor('bulletin', null, new Date(), poll)).toMatchObject({
      kicker: 'Club poll',
      title: 'October: pick the PTA film',
    })
  })

  it('keeps the screening on the card when there is one', () => {
    expect(cardFor('bulletin', screening, new Date(), poll).kicker).toBe('Next screening')
  })
})

describe('cardActions', () => {
  it.each([
    ['bulletin', true, ['rsvp', 'club', 'back']],
    ['bulletin', false, ['club', 'back']],
    ['suggestion', false, ['suggest', 'back']],
    ['telephone', true, ['rsvp', 'back']],
    ['telephone', false, ['club', 'back']],
  ] as const)('%s with a screening: %s', (id, scheduled, expected) => {
    expect(cardActions(id, scheduled ? screening : null)).toEqual(expected)
  })
})

it('spreads buttons evenly inside the card', () => {
  const row = buttonRow(1, 3)
  expect((row.xs[0] as number) - row.width / 2).toBeCloseTo(-0.43)
  expect((row.xs[2] as number) + row.width / 2).toBeCloseTo(0.43)
  expect((row.xs[1] as number) - (row.xs[0] as number)).toBeCloseTo(row.width + 0.03)
})

it('tells the telephone which film is next', () => {
  const card = cardFor('telephone', screening, new Date(2026, 8, 18, 12))
  expect(card.body).toBe('Let us know if you’re coming to There Will Be Blood.\nTonight · 7:30 PM')
})
