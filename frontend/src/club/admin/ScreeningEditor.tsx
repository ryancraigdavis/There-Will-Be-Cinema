import { type FormEvent, type ReactNode, useId, useState } from 'react'
import type { CatalogItem } from '../../catalog/types'
import {
  type Draft,
  type DraftProblems,
  draftFromScreening,
  draftPayload,
  draftPreview,
  draftProblems,
  emptyDraft,
  withFilm,
  withoutFilm,
} from '../draft'
import { ScreeningCard } from '../ScreeningCard'
import { deleteScreening, saveScreening } from '../screenings'
import type { AdminScreening, ScreeningStatus } from '../types'
import { ChosenFilm, FilmSearch, useFilm } from './FilmPicker'

const STATUSES: { value: ScreeningStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
]

type Source = 'library' | 'other'

interface FieldProps {
  label: string
  problem?: string
  hint?: string
  children: (id: string) => ReactNode
}

function Field({ label, problem, hint, children }: FieldProps) {
  const id = useId()
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {hint === undefined ? null : <span className="field__hint">{hint}</span>}
      {problem === undefined ? null : <span className="field__problem">{problem}</span>}
    </div>
  )
}

interface FilmProps {
  draft: Draft
  film: CatalogItem | undefined
  problems: DraftProblems
  change: (update: (draft: Draft) => Draft) => void
}

function OtherFilm({ draft, problems, change }: FilmProps) {
  const set = (patch: Partial<Draft>) => change((current) => ({ ...current, ...patch }))
  return (
    <div className="editor__row">
      <Field label="Title" problem={problems.film}>
        {(id) => (
          <input
            id={id}
            className="field__input"
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
          />
        )}
      </Field>
      <Field label="Year" problem={problems.year}>
        {(id) => (
          <input
            id={id}
            className="field__input"
            inputMode="numeric"
            value={draft.year}
            onChange={(e) => set({ year: e.target.value })}
          />
        )}
      </Field>
      <Field
        label="Poster image address"
        hint="A link to a poster image. We keep a copy."
        problem={problems.artUrl}
      >
        {(id) => (
          <input
            id={id}
            className="field__input"
            type="url"
            value={draft.artUrl}
            placeholder="https://"
            onChange={(e) => set({ artUrl: e.target.value })}
          />
        )}
      </Field>
    </div>
  )
}

function FilmChoice(props: FilmProps) {
  const [source, setSource] = useState<Source>(
    props.draft.itemId || !props.draft.title ? 'library' : 'other',
  )
  const choose = (next: Source) => {
    setSource(next)
    props.change(withoutFilm)
  }
  const library = props.film ? (
    <ChosenFilm film={props.film} onChange={() => props.change(withoutFilm)} />
  ) : (
    <FilmSearch onPick={(film) => props.change((draft) => withFilm(draft, film))} />
  )
  return (
    <fieldset className="editor__film">
      <legend className="field__label">Film</legend>
      <div className="segmented">
        <div className="options">
          <button
            type="button"
            className="chip"
            aria-pressed={source === 'library'}
            onClick={() => choose('library')}
          >
            From the library
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={source === 'other'}
            onClick={() => choose('other')}
          >
            Not in the library
          </button>
        </div>
      </div>
      {source === 'library' ? library : <OtherFilm {...props} />}
      {source === 'library' && props.problems.film ? (
        <span className="field__problem">{props.problems.film}</span>
      ) : null}
    </fieldset>
  )
}

function StatusChoice({
  status,
  onChange,
}: {
  status: ScreeningStatus
  onChange: (status: ScreeningStatus) => void
}) {
  return (
    <fieldset className="segmented">
      <legend className="field__label">Status</legend>
      <div className="options">
        {STATUSES.map((option) => (
          <button
            key={option.value}
            type="button"
            className="chip"
            aria-pressed={status === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function failureText(error: unknown): string {
  return error instanceof Error
    ? `Couldn’t save: ${error.message}`
    : 'Couldn’t save that screening.'
}

interface Props {
  screening: AdminScreening | null
  onDone: () => void
}

export function ScreeningEditor({ screening, onDone }: Props) {
  const [draft, setDraft] = useState<Draft>(() =>
    screening ? draftFromScreening(screening) : emptyDraft(),
  )
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const film = useFilm(draft.itemId)
  const problems = draftProblems(draft)
  const shown = checked ? problems : {}
  const preview = draftPreview(draft, film)
  const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }))

  const run = async (work: () => Promise<unknown>) => {
    setBusy(true)
    setFailure(null)
    try {
      await work()
      onDone()
    } catch (error) {
      setFailure(failureText(error))
      setBusy(false)
    }
  }

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setChecked(true)
    const ready = Object.keys(problems).length === 0 && !busy
    return ready ? run(() => saveScreening(screening?.id ?? null, draftPayload(draft))) : undefined
  }

  const remove = () => {
    const sure =
      screening !== null && window.confirm(`Delete “${screening.title}”? This can’t be undone.`)
    return sure ? run(() => deleteScreening(screening.id)) : undefined
  }

  return (
    <form className="editor" onSubmit={save} noValidate>
      <div className="editor__fields">
        <h3 className="editor__title">{screening ? 'Edit screening' : 'New screening'}</h3>
        <FilmChoice draft={draft} film={film} problems={shown} change={setDraft} />
        <div className="editor__row">
          <Field label="Date and time" problem={shown.startsAt}>
            {(id) => (
              <input
                id={id}
                className="field__input"
                type="datetime-local"
                value={draft.startsAt}
                onChange={(e) => set({ startsAt: e.target.value })}
              />
            )}
          </Field>
          <Field label="Where" problem={shown.location}>
            {(id) => (
              <input
                id={id}
                className="field__input"
                value={draft.location}
                placeholder="Living room"
                onChange={(e) => set({ location: e.target.value })}
              />
            )}
          </Field>
        </div>
        <Field
          label="Message"
          hint="The note from the hosts, shown above the description."
          problem={shown.message}
        >
          {(id) => (
            <textarea
              id={id}
              className="field__input"
              rows={2}
              value={draft.message}
              onChange={(e) => set({ message: e.target.value })}
            />
          )}
        </Field>
        <Field label="Description" problem={shown.description}>
          {(id) => (
            <textarea
              id={id}
              className="field__input"
              rows={5}
              value={draft.description}
              onChange={(e) => set({ description: e.target.value, autoDescription: false })}
            />
          )}
        </Field>
        <StatusChoice status={draft.status} onChange={(status) => set({ status })} />
        {failure === null ? null : (
          <p className="club-form__problem" role="alert">
            {failure}
          </p>
        )}
        <div className="editor__actions">
          <button type="submit" className="button" disabled={busy}>
            {screening ? 'Save changes' : 'Add screening'}
          </button>
          <button type="button" className="button button--ghost" disabled={busy} onClick={onDone}>
            Cancel
          </button>
          {screening ? (
            <button
              type="button"
              className="button button--danger"
              disabled={busy}
              onClick={remove}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
      <aside className="editor__preview">
        <span className="field__label">What members see</span>
        {preview ? (
          <ScreeningCard screening={preview} compact />
        ) : (
          <p className="panel__detail">Pick a film and a time to preview the card.</p>
        )}
      </aside>
    </form>
  )
}
