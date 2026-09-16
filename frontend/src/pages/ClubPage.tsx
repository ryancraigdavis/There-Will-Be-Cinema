import '../club/club.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { screeningDate, screeningTime } from '../club/format'
import { RsvpForm } from '../club/RsvpForm'
import { ScreeningCard } from '../club/ScreeningCard'
import { SuggestionForm } from '../club/SuggestionForm'
import { laterScreenings, useScreenings } from '../club/screenings'
import type { Screening } from '../club/types'
import { SiteHeader } from '../ui/SiteHeader'

type Panel = { kind: 'rsvp'; screening: Screening } | { kind: 'suggest' } | null

function ComingUp({
  screenings,
  onRsvp,
}: {
  screenings: Screening[]
  onRsvp: (s: Screening) => void
}) {
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
            <button type="button" className="chip" onClick={() => onRsvp(screening)}>
              RSVP
            </button>
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

function ClubPanel({ panel, onClose }: { panel: Exclude<Panel, null>; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])
  return (
    <section
      ref={ref}
      className="club-panel"
      aria-label={panel.kind === 'rsvp' ? 'RSVP' : 'Suggest a film'}
    >
      <header className="sheet__head">
        <h2 className="sheet__title">{panel.kind === 'rsvp' ? 'RSVP' : 'Suggestion box'}</h2>
        <button type="button" className="chip" onClick={onClose}>
          Close
        </button>
      </header>
      {panel.kind === 'rsvp' ? (
        <RsvpForm screening={panel.screening} onDone={onClose} />
      ) : (
        <SuggestionForm onDone={onClose} />
      )}
    </section>
  )
}

function Actions({ next, onOpen }: { next: Screening | null; onOpen: (panel: Panel) => void }) {
  return (
    <div className="club-actions">
      {next === null ? null : (
        <button
          type="button"
          className="button"
          onClick={() => onOpen({ kind: 'rsvp', screening: next })}
        >
          RSVP
        </button>
      )}
      <button
        type="button"
        className="button button--ghost"
        onClick={() => onOpen({ kind: 'suggest' })}
      >
        Suggest a film
      </button>
    </div>
  )
}

function panelKey(panel: Exclude<Panel, null>): string {
  return panel.kind === 'rsvp' ? `rsvp-${panel.screening.id}` : 'suggest'
}

export function ClubPage() {
  const next = useScreenings((state) => state.next)
  const schedule = useScreenings((state) => state.schedule)
  const known = useScreenings((state) => state.known)
  const [panel, setPanel] = useState<Panel>(null)
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
        <Actions next={next} onOpen={setPanel} />
        {panel === null ? null : (
          <ClubPanel key={panelKey(panel)} panel={panel} onClose={() => setPanel(null)} />
        )}
        <ComingUp
          screenings={later}
          onRsvp={(screening) => setPanel({ kind: 'rsvp', screening })}
        />
      </main>
    </>
  )
}
