import {
  type KeyboardEvent as ReactKeyboardEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { formatCount } from '../catalog/format'
import { bestMatches, buildIndex, normalizeTerm, rankIds } from '../catalog/search'
import type { Catalog, CatalogItem } from '../catalog/types'
import { enterStore } from '../lobby/Lobby'
import { releaseLock, requestLock } from '../player/pointerLock'
import { useScene } from '../shell/sceneState'
import type { DirectoryEntry, StorePlan } from '../store/layout'
import { buildLocations, genreStops, type StoreLocation } from '../store/locate'
import { SearchIcon } from './icons'

const RESULT_LIMIT = 24
const OPEN_KEYS = new Set(['KeyM', 'Slash'])

function typing(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

export function openGuide() {
  useScene.getState().setGuide(true)
  releaseLock()
}

export function closeGuide() {
  const scene = useScene.getState()
  scene.setGuide(false)
  scene.setPaused(false)
  void requestLock(scene.canvas)
}

function toggleGuide() {
  const toggle = useScene.getState().guide ? closeGuide : openGuide
  toggle()
}

function travelTo(location: StoreLocation, itemId: string | null) {
  const scene = useScene.getState()
  scene.setGuide(false)
  scene.setPaused(false)
  const walkIn = scene.mode === 'free' ? () => requestLock(scene.canvas) : enterStore
  void walkIn()
  scene.setTravel({ pose: location.pose, itemId })
}

function keyAction(event: KeyboardEvent): (() => void) | null {
  const scene = useScene.getState()
  const choices: [boolean, () => void][] = [
    [OPEN_KEYS.has(event.code) && !typing(event.target) && scene.mode !== 'intro', toggleGuide],
    [event.code === 'Escape' && scene.guide, closeGuide],
  ]
  return choices.find(([when]) => when)?.[1] ?? null
}

function useGuideKeys(active: boolean) {
  useEffect(() => {
    if (!active) {
      return
    }
    const onKey = (event: KeyboardEvent) => {
      const action = keyAction(event)
      if (!action) {
        return
      }
      event.preventDefault()
      event.stopImmediatePropagation()
      action()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [active])
}

function whereLine(location: StoreLocation | undefined): string {
  return location ? [location.bay, location.aisle].filter(Boolean).join(' · ') : 'Not on a shelf'
}

interface RowProps {
  film: CatalogItem
  location: StoreLocation | undefined
}

function FilmRow({ film, location }: RowProps) {
  return (
    <li>
      <button
        type="button"
        className="guide__row"
        disabled={!location}
        onClick={() => location && travelTo(location, film.id)}
      >
        <span className="guide__title">
          {film.title}
          {film.year === null ? null : <span className="guide__year"> {film.year}</span>}
        </span>
        <span className="guide__where">{whereLine(location)}</span>
      </button>
    </li>
  )
}

function AisleRow({ entry, stop }: { entry: DirectoryEntry; stop: StoreLocation | undefined }) {
  return (
    <li>
      <button
        type="button"
        className="guide__row guide__row--aisle"
        disabled={!stop}
        onClick={() => stop && travelTo(stop, null)}
      >
        <span className="guide__title">{entry.genre}</span>
        <span className="guide__where">{entry.aisle}</span>
      </button>
    </li>
  )
}

interface ListProps {
  films: CatalogItem[]
  aisles: DirectoryEntry[]
  locations: Map<string, StoreLocation>
  stops: Map<string, StoreLocation>
  searching: boolean
}

function GuideLists({ films, aisles, locations, stops, searching }: ListProps) {
  return (
    <div className="guide__lists">
      {aisles.length === 0 ? null : (
        <section>
          <h3 className="guide__heading">{searching ? 'Sections' : 'Directory'}</h3>
          <ul className="guide__list">
            {aisles.map((entry) => (
              <AisleRow key={entry.genre} entry={entry} stop={stops.get(entry.genre)} />
            ))}
          </ul>
        </section>
      )}
      {!searching ? null : (
        <section>
          <h3 className="guide__heading">{formatCount(films.length, 'title')}</h3>
          <ul className="guide__list">
            {films.map((film) => (
              <FilmRow key={film.id} film={film} location={locations.get(film.id)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function matchingAisles(directory: readonly DirectoryEntry[], query: string): DirectoryEntry[] {
  const term = normalizeTerm(query.trim())
  return term === ''
    ? [...directory]
    : directory.filter((entry) => normalizeTerm(entry.genre).includes(term))
}

function useFocusOnOpen(open: boolean) {
  const field = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) {
      field.current?.focus()
      field.current?.select()
    }
  }, [open])
  return field
}

interface Props {
  catalog: Catalog | null
  plan: StorePlan | null
  active: boolean
}

export function Guide({ catalog, plan, active }: Props) {
  const open = useScene((state) => state.guide) && active
  const [query, setQuery] = useState('')
  const [armed, setArmed] = useState(false)
  const deferred = useDeferredValue(query)
  const field = useFocusOnOpen(open)
  useGuideKeys(active)

  useEffect(() => {
    setArmed((was) => was || open)
  }, [open])

  const index = useMemo(
    () => (armed && catalog ? buildIndex(catalog.items) : null),
    [armed, catalog],
  )
  const locations = useMemo(() => (plan ? buildLocations(plan) : new Map()), [plan])
  const stops = useMemo(() => (plan ? genreStops(plan) : new Map()), [plan])
  const ranked = useMemo(() => (index ? rankIds(index, deferred) : null), [index, deferred])
  const films = useMemo(
    () =>
      catalog && ranked
        ? bestMatches(
            ranked.flatMap((id) => catalog.byId.get(id) ?? []),
            deferred,
          ).slice(0, RESULT_LIMIT)
        : [],
    [catalog, ranked, deferred],
  )
  const aisles = useMemo(() => matchingAisles(plan?.directory ?? [], deferred), [plan, deferred])
  const placeholder = catalog ? `Search ${formatCount(catalog.items.length, 'title')}` : 'Loading…'
  const top = films[0]
  const goToTop = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    const location = top ? locations.get(top.id) : undefined
    if (event.key === 'Enter' && top && location) {
      travelTo(location, top.id)
    }
  }

  return !open ? null : (
    <div className="guide">
      <section className="guide__panel" aria-label="Store guide">
        <header className="guide__head">
          <h2 className="guide__name">Find a movie</h2>
          <button type="button" className="chip" onClick={closeGuide}>
            Close · Esc
          </button>
        </header>
        <div className="search-box">
          <SearchIcon />
          <input
            ref={field}
            type="search"
            value={query}
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            aria-label="Search titles"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={goToTop}
          />
        </div>
        <GuideLists
          films={films}
          aisles={aisles}
          locations={locations}
          stops={stops}
          searching={ranked !== null}
        />
        <p className="guide__hint">
          Enter walks you to the first result. Esc closes. M reopens this.
        </p>
      </section>
    </div>
  )
}
