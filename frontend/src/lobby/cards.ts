import { screeningWhen } from '../club/format'
import type { Screening } from '../club/types'
import type { Vec3 } from '../scene/math'
import { BULLETIN, besideBulletin, COUNTER, FIXTURES, type FixtureId } from './anchors'

export interface CardSpec {
  position: Vec3
  yaw: number
  width: number
  height: number
  kicker: string
  title: string
  body: string
}

type Place = Omit<CardSpec, 'kicker' | 'title' | 'body'>
type Copy = Pick<CardSpec, 'kicker' | 'title' | 'body'>

const CARD_Z = COUNTER.maxZ - 0.2

const PLACES: Record<FixtureId, Place> = {
  bulletin: {
    position: besideBulletin(0.9, 0.35, BULLETIN.y),
    yaw: BULLETIN.yaw,
    width: 0.72,
    height: 0.62,
  },
  suggestion: {
    position: [FIXTURES.suggestion[0] + 0.5, 1.38, CARD_Z],
    yaw: 0,
    width: 0.5,
    height: 0.42,
  },
  telephone: {
    position: [FIXTURES.telephone[0] + 0.5, 1.36, CARD_Z],
    yaw: 0,
    width: 0.46,
    height: 0.4,
  },
}

export function filmTitle(screening: Pick<Screening, 'title' | 'year'>): string {
  return screening.year === null ? screening.title : `${screening.title} (${screening.year})`
}

function bulletinCopy(next: Screening | null, now: Date): Copy {
  return next === null
    ? {
        kicker: 'Movie club',
        title: 'Nothing on the schedule yet',
        body: 'The next screening gets pinned up here as soon as it’s set.',
      }
    : {
        kicker: 'Next screening',
        title: filmTitle(next),
        body: [screeningWhen(next.startsAt, now), next.location, next.message]
          .filter(Boolean)
          .join('\n'),
      }
}

const COPY: Record<FixtureId, (next: Screening | null, now: Date) => Copy> = {
  bulletin: bulletinCopy,
  suggestion: () => ({
    kicker: 'Suggestion box',
    title: 'Pitch us a movie',
    body: 'The suggestion box opens very soon. Keep your list handy.',
  }),
  telephone: () => ({
    kicker: 'RSVP line',
    title: 'Call ahead for a seat',
    body: 'The RSVP line gets connected very soon.',
  }),
}

export function cardFor(id: FixtureId, next: Screening | null, now: Date): CardSpec {
  return { ...PLACES[id], ...COPY[id](next, now) }
}
