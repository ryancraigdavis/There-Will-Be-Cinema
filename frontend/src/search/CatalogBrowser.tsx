import './catalog.css'
import { useCallback, useDeferredValue, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  type Filters,
  genreCounts,
  selectResults,
  yearBounds,
} from '../catalog/filters'
import { formatCount } from '../catalog/format'
import { filtersFromParams, paramsFromFilters } from '../catalog/params'
import { buildIndex, rankIds } from '../catalog/search'
import type { Catalog, SiteInfo } from '../catalog/types'
import { FilterBar } from './FilterBar'
import { ResultsGrid } from './ResultsGrid'

interface Props {
  catalog: Catalog
  site: SiteInfo | null
}

export function CatalogBrowser({ catalog, site }: Props) {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => filtersFromParams(params), [params])
  const deferred = useDeferredValue(filters)
  const index = useMemo(() => buildIndex(catalog.items), [catalog.items])
  const bounds = useMemo(() => yearBounds(catalog.items), [catalog.items])
  const ranked = useMemo(() => rankIds(index, deferred.query), [index, deferred.query])
  const results = useMemo(
    () => selectResults(catalog, ranked, deferred),
    [catalog, ranked, deferred],
  )
  const genres = useMemo(() => genreCounts(results), [results])
  const resultsKey = useMemo(() => paramsFromFilters(deferred).toString(), [deferred])

  const update = useCallback(
    (patch: Partial<Filters>) =>
      setParams((current) => paramsFromFilters({ ...filtersFromParams(current), ...patch }), {
        replace: 'query' in patch,
      }),
    [setParams],
  )
  const reset = useCallback(() => setParams(paramsFromFilters(DEFAULT_FILTERS)), [setParams])

  return (
    <>
      <FilterBar
        filters={filters}
        genres={genres}
        bounds={bounds}
        total={catalog.items.length}
        activeCount={activeFilterCount(filters)}
        onChange={update}
        onReset={reset}
      />
      <section className="results" aria-label="Results">
        <p className="results__count" aria-live="polite">
          {formatCount(results.length, 'title')}
        </p>
        {results.length > 0 ? (
          <ResultsGrid key={resultsKey} items={results} site={site} />
        ) : (
          <EmptyShelf onReset={reset} />
        )}
      </section>
    </>
  )
}

function EmptyShelf({ onReset }: { onReset: () => void }) {
  return (
    <div className="empty">
      <p className="empty__title">Nothing on this shelf.</p>
      <p className="empty__hint">Try a shorter search or fewer filters.</p>
      <button type="button" className="button" onClick={onReset}>
        Clear everything
      </button>
    </div>
  )
}
