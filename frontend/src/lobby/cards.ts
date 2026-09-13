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

const CARD_Z = COUNTER.maxZ - 0.2

export const CARDS: Record<FixtureId, CardSpec> = {
  bulletin: {
    position: besideBulletin(0.9, 0.35, BULLETIN.y),
    yaw: BULLETIN.yaw,
    width: 0.72,
    height: 0.62,
    kicker: 'Movie club',
    title: 'The schedule is moving in',
    body: 'Screenings will be pinned right here soon. Until then, the full schedule lives on the club site.',
  },
  suggestion: {
    position: [FIXTURES.suggestion[0] + 0.5, 1.38, CARD_Z],
    yaw: 0,
    width: 0.5,
    height: 0.42,
    kicker: 'Suggestion box',
    title: 'Pitch us a movie',
    body: 'Soon you can drop suggestions straight into this box. For now, send them through the club site.',
  },
  telephone: {
    position: [FIXTURES.telephone[0] + 0.5, 1.36, CARD_Z],
    yaw: 0,
    width: 0.46,
    height: 0.4,
    kicker: 'RSVP line',
    title: 'Call ahead for a seat',
    body: 'RSVPs by phone are on the way. Until the line is connected, RSVP on the club site.',
  },
}
