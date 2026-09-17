import { screeningWhen } from '../club/format'
import type { Poll, Screening } from '../club/types'
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

function bulletinCopy(next: Screening | null, now: Date, poll: Poll | null): Copy {
  const quiet = poll
    ? {
        kicker: 'Club poll',
        title: poll.question,
        body: 'Cast your vote before the hosts close the poll.',
      }
    : {
        kicker: 'Movie club',
        title: 'Nothing on the schedule yet',
        body: 'The next screening gets pinned up here as soon as it’s set.',
      }
  return next === null
    ? quiet
    : {
        kicker: 'Next screening',
        title: filmTitle(next),
        body: [screeningWhen(next.startsAt, now), next.location, next.message]
          .filter(Boolean)
          .join('\n'),
      }
}

function telephoneCopy(next: Screening | null, now: Date): Copy {
  return next === null
    ? {
        kicker: 'RSVP line',
        title: 'The line is quiet',
        body: 'Nothing is on the schedule yet. Check the bulletin board for news.',
      }
    : {
        kicker: 'RSVP line',
        title: 'Call ahead for a seat',
        body: `Let us know if you’re coming to ${next.title}.\n${screeningWhen(next.startsAt, now)}`,
      }
}

const COPY: Record<FixtureId, (next: Screening | null, now: Date, poll: Poll | null) => Copy> = {
  bulletin: bulletinCopy,
  suggestion: () => ({
    kicker: 'Suggestion box',
    title: 'Pitch us a movie',
    body: 'Anything from the library, or something we should track down.',
  }),
  telephone: telephoneCopy,
}

export type CardAction = 'vote' | 'rsvp' | 'suggest' | 'club' | 'back'

const BULLETIN_ACTIONS: Record<string, CardAction[]> = {
  'screening+poll': ['vote', 'rsvp', 'back'],
  screening: ['rsvp', 'club', 'back'],
  poll: ['vote', 'club', 'back'],
  quiet: ['club', 'back'],
}

function bulletinActions(scheduled: boolean, polling: boolean): CardAction[] {
  const key = [scheduled && 'screening', polling && 'poll'].filter(Boolean).join('+') || 'quiet'
  return BULLETIN_ACTIONS[key] ?? ['club', 'back']
}

const ACTIONS: Record<FixtureId, (scheduled: boolean, polling: boolean) => CardAction[]> = {
  bulletin: bulletinActions,
  suggestion: () => ['suggest', 'back'],
  telephone: (scheduled) => (scheduled ? ['rsvp', 'back'] : ['club', 'back']),
}

export function cardActions(
  id: FixtureId,
  next: Screening | null,
  poll: Poll | null = null,
): CardAction[] {
  return ACTIONS[id](next !== null, poll !== null)
}

export function buttonRow(width: number, count: number): { width: number; xs: number[] } {
  const inner = width * 0.86
  const gap = width * 0.03
  const button = (inner - gap * (count - 1)) / count
  const xs = Array.from({ length: count }, (_, i) => -inner / 2 + button / 2 + i * (button + gap))
  return { width: button, xs }
}

export function cardFor(
  id: FixtureId,
  next: Screening | null,
  now: Date,
  poll: Poll | null = null,
): CardSpec {
  return { ...PLACES[id], ...COPY[id](next, now, poll) }
}
