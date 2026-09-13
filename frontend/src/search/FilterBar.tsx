import { useEffect, useId, useState } from 'react'
import {
  type Filters,
  FORMAT_OPTIONS,
  SORT_OPTIONS,
  TYPE_OPTIONS,
  toggle,
} from '../catalog/filters'
import { formatCount } from '../catalog/format'
import { toYear } from '../catalog/params'
import { SearchInput } from './SearchInput'

interface Props {
  filters: Filters
  genres: [string, number][]
  bounds: [number, number]
  total: number
  activeCount: number
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
}

export function FilterBar({
  filters,
  genres,
  bounds,
  total,
  activeCount,
  onChange,
  onReset,
}: Props) {
  const sortId = useId()
  return (
    <div className="filters">
      <div className="filters__row filters__row--top">
        <SearchInput
          value={filters.query}
          total={total}
          onCommit={(query) => onChange({ query })}
        />
        <div className="sort">
          <label htmlFor={sortId} className="field-label">
            Sort
          </label>
          <select
            id={sortId}
            value={filters.sort}
            onChange={(event) => onChange({ sort: event.target.value as Filters['sort'] })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filters__row">
        <fieldset className="segmented">
          <legend className="field-label">Type</legend>
          <div className="options">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="chip"
                aria-pressed={filters.type === option.value}
                onClick={() => onChange({ type: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="field-label">Format</legend>
          <div className="options">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="chip"
                aria-pressed={filters.formats.includes(option.value)}
                onClick={() => onChange({ formats: toggle(filters.formats, option.value) })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="years">
          <legend className="field-label">Years</legend>
          <div className="options">
            <YearInput
              label="From year"
              value={filters.yearFrom}
              placeholder={bounds[0]}
              onCommit={(yearFrom) => onChange({ yearFrom })}
            />
            <span aria-hidden="true">–</span>
            <YearInput
              label="To year"
              value={filters.yearTo}
              placeholder={bounds[1]}
              onCommit={(yearTo) => onChange({ yearTo })}
            />
          </div>
        </fieldset>

        {activeCount > 0 && (
          <button type="button" className="button button--ghost filters__clear" onClick={onReset}>
            Clear {formatCount(activeCount, 'filter')}
          </button>
        )}
      </div>

      <fieldset className="genres">
        <legend className="field-label">Genre</legend>
        <div className="options">
          {genres.map(([genre, count]) => (
            <button
              key={genre}
              type="button"
              className="chip"
              aria-pressed={filters.genres.includes(genre)}
              onClick={() => onChange({ genres: toggle(filters.genres, genre) })}
            >
              {genre}
              <span className="chip__count">{count.toLocaleString('en-US')}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

interface YearInputProps {
  label: string
  value: number | null
  placeholder: number
  onCommit: (year: number | null) => void
}

function YearInput({ label, value, placeholder, onCommit }: YearInputProps) {
  const [draft, setDraft] = useState(value?.toString() ?? '')

  useEffect(() => {
    setDraft((current) => (toYear(current) === value ? current : (value?.toString() ?? '')))
  }, [value])

  const handleChange = (text: string) => {
    setDraft(text)
    const next = toYear(text)
    if (next !== value) {
      onCommit(next)
    }
  }

  return (
    <input
      className="years__input"
      type="text"
      inputMode="numeric"
      maxLength={4}
      aria-label={label}
      value={draft}
      placeholder={String(placeholder)}
      onChange={(event) => handleChange(event.target.value)}
    />
  )
}
