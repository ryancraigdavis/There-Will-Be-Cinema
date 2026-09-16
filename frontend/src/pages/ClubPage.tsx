import '../club/club.css'
import { useMemo } from 'react'
import { screeningDate, screeningTime } from '../club/format'
import { ScreeningCard } from '../club/ScreeningCard'
import { laterScreenings, useScreenings } from '../club/screenings'
import type { Screening } from '../club/types'
import { SiteHeader } from '../ui/SiteHeader'

function ComingUp({ screenings }: { screenings: Screening[] }) {
  return screenings.length === 0 ? null : (
    <section className="coming-up" aria-labelledby="coming-up-title">
      <h2 id="coming-up-title" className="section-head__title">
        Coming up
      </h2>
      <ol className="coming-up__list">
        {screenings.map((screening) => (
          <li key={screening.id} className="coming-up__row">
            <span className="coming-up__date">{screeningDate(screening.startsAt)}</span>
            <span className="coming-up__film">
              {screening.title}
              {screening.year === null ? null : (
                <span className="screening__year"> {screening.year}</span>
              )}
            </span>
            <span className="coming-up__time">{screeningTime(screening.startsAt)}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function NothingScheduled() {
  return (
    <section className="club-gate">
      <h2 className="club-gate__title">Nothing on the schedule</h2>
      <p className="club-gate__detail">The next screening goes up here as soon as it’s set.</p>
    </section>
  )
}

export function ClubPage() {
  const next = useScreenings((state) => state.next)
  const schedule = useScreenings((state) => state.schedule)
  const known = useScreenings((state) => state.known)
  const later = useMemo(() => laterScreenings(schedule, next), [schedule, next])
  const lead = next === null ? <NothingScheduled /> : <ScreeningCard screening={next} />
  return (
    <>
      <SiteHeader />
      <main className="club-page">
        <h1 className="club-page__title">Movie club</h1>
        {known ? (
          lead
        ) : (
          <div className="reel club-page__loading" role="status" aria-label="Loading" />
        )}
        <ComingUp screenings={later} />
      </main>
    </>
  )
}
