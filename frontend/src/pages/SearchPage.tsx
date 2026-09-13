import { readyValue, useCatalog, useSite } from '../catalog/resources'
import { CatalogBrowser } from '../search/CatalogBrowser'
import { SiteHeader } from '../ui/SiteHeader'
import { StatusPanel } from '../ui/StatusPanel'

export function SearchPage() {
  const catalog = useCatalog()
  const site = readyValue(useSite())
  return (
    <>
      <SiteHeader />
      <main className="catalog-page">
        <h1 className="visually-hidden">Catalog</h1>
        {catalog.status === 'ready' ? (
          <CatalogBrowser catalog={catalog.value} site={site} />
        ) : (
          <StatusPanel resource={catalog} loading="Rewinding tapes…" />
        )}
      </main>
    </>
  )
}
