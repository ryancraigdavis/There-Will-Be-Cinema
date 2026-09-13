import { useEffect, useRef, useState } from 'react'
import { embyItemUrl } from '../api'
import type { CatalogItem, SiteInfo } from '../catalog/types'
import { PosterCard } from './PosterCard'

const PAGE_SIZE = 96

interface Props {
  items: CatalogItem[]
  site: SiteInfo | null
}

export function ResultsGrid({ items, site }: Props) {
  const [limit, setLimit] = useState(PAGE_SIZE)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinel.current
    if (!node || limit >= items.length) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLimit((current) => current + PAGE_SIZE)
        }
      },
      { rootMargin: '1200px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [limit, items.length])

  return (
    <>
      <ul className="grid">
        {items.slice(0, limit).map((item) => (
          <li key={item.id}>
            <PosterCard item={item} href={site ? embyItemUrl(site, item.id) : undefined} />
          </li>
        ))}
      </ul>
      {limit < items.length && <div ref={sentinel} className="grid__sentinel" />}
    </>
  )
}
