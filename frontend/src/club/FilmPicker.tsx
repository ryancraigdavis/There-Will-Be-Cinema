import { type ReactNode, useDeferredValue, useMemo, useState } from 'react'
import { readyValue, useCatalog } from '../catalog/resources'
import { bestMatches, buildIndex, rankIds } from '../catalog/search'
import type { Catalog, CatalogItem } from '../catalog/types'
import { API_BASE } from '../config'
import { Choice, Field } from './Field'

const RESULTS = 8

const thumbUrl = (film: CatalogItem) =>
  `${API_BASE}/api/thumbs/${encodeURIComponent(film.id)}.webp?v=${film.imageTag ?? ''}`

function Thumb({ film }: { film: CatalogItem }) {
  return film.imageTag === null ? (
    <span className="film-thumb film-thumb--blank" />
  ) : (
    <img className="film-thumb" src={thumbUrl(film)} alt="" loading="lazy" />
  )
}

function useMatches(catalog: Catalog | null, query: string): CatalogItem[] {
  const index = useMemo(() => (catalog ? buildIndex(catalog.items) : null), [catalog])
  return useMemo(() => {
    const ranked = index ? (rankIds(index, query) ?? []) : []
    const films = ranked.flatMap((id) => catalog?.byId.get(id) ?? [])
    return bestMatches(films, query).slice(0, RESULTS)
  }, [catalog, index, query])
}

export function ChosenFilm({ film, onChange }: { film: CatalogItem; onChange: () => void }) {
  return (
    <div className="film-chosen">
      <Thumb film={film} />
      <div className="film-chosen__text">
        <strong>{film.title}</strong>
        <span>{film.year ?? 'Year unknown'}</span>
      </div>
      <button type="button" className="chip" onClick={onChange}>
        Change
      </button>
    </div>
  )
}

export function FilmSearch({ onPick }: { onPick: (film: CatalogItem) => void }) {
  const catalog = readyValue(useCatalog())
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const matches = useMatches(catalog, deferred)
  return (
    <div className="film-search">
      <input
        className="field__input"
        type="search"
        value={query}
        placeholder={catalog ? 'Search the library' : 'Loading the library…'}
        aria-label="Search the library"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => setQuery(event.target.value)}
      />
      {matches.length === 0 ? null : (
        <ul className="film-search__results">
          {matches.map((film) => (
            <li key={film.id}>
              <button type="button" className="film-search__row" onClick={() => onPick(film)}>
                <Thumb film={film} />
                <span className="film-search__title">{film.title}</span>
                <span className="film-search__year">{film.year ?? ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function useFilm(itemId: string | null): CatalogItem | undefined {
  const catalog = readyValue(useCatalog())
  return itemId === null ? undefined : catalog?.byId.get(itemId)
}

type Source = 'library' | 'other'

const SOURCES: { value: Source; label: string }[] = [
  { value: 'library', label: 'From the library' },
  { value: 'other', label: 'Not in the library' },
]

interface FilmFieldsProps {
  itemId: string | null
  title: string
  year: string
  problems: { film?: string; year?: string }
  onPick: (film: CatalogItem) => void
  onClear: () => void
  onTyped: (patch: { title?: string; year?: string }) => void
  extra?: ReactNode
}

function TypedFilm({ title, year, problems, onTyped, extra }: FilmFieldsProps) {
  return (
    <div className="editor__row">
      <Field label="Title" problem={problems.film}>
        {(id) => (
          <input
            id={id}
            className="field__input"
            value={title}
            onChange={(e) => onTyped({ title: e.target.value })}
          />
        )}
      </Field>
      <Field label="Year" problem={problems.year}>
        {(id) => (
          <input
            id={id}
            className="field__input"
            inputMode="numeric"
            value={year}
            onChange={(e) => onTyped({ year: e.target.value })}
          />
        )}
      </Field>
      {extra}
    </div>
  )
}

function LibraryFilm({ itemId, problems, onPick, onClear }: FilmFieldsProps) {
  const film = useFilm(itemId)
  return (
    <>
      {film ? <ChosenFilm film={film} onChange={onClear} /> : <FilmSearch onPick={onPick} />}
      {problems.film === undefined ? null : <span className="field__problem">{problems.film}</span>}
    </>
  )
}

export function FilmFields(props: FilmFieldsProps) {
  const [source, setSource] = useState<Source>(props.itemId || !props.title ? 'library' : 'other')
  const choose = (next: Source) => {
    setSource(next)
    props.onClear()
  }
  return (
    <div className="film-fields">
      <Choice legend="Film" options={SOURCES} value={source} onChange={choose} />
      {source === 'library' ? <LibraryFilm {...props} /> : <TypedFilm {...props} />}
    </div>
  )
}
