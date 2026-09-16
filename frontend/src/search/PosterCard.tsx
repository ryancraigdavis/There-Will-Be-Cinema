import { memo } from 'react'
import { posterUrl } from '../api'
import { badgesFor } from '../catalog/badges'
import { metaLine } from '../catalog/format'
import type { CatalogItem } from '../catalog/types'

interface Props {
  item: CatalogItem
  href: string | undefined
}

function specsLine(item: CatalogItem): string {
  const rating = item.rating ? `★ ${item.rating.toFixed(1)}` : null
  return [rating, item.officialRating, item.audio].filter(Boolean).join(' · ')
}

export const PosterCard = memo(function PosterCard({ item, href }: Props) {
  const versions = item.versionCount > 1 ? `${item.versionCount} versions` : null
  const meta = [metaLine(item), versions].filter(Boolean).join(' · ')
  return (
    <a className="card" href={href} target="_blank" rel="noopener noreferrer">
      <div className="card__box">
        {item.imageTag ? (
          <img
            src={posterUrl(item)}
            alt=""
            loading="lazy"
            decoding="async"
            width={400}
            height={600}
          />
        ) : (
          <div className="card__blank" aria-hidden="true">
            <span>{item.title}</span>
          </div>
        )}
        <div className="card__back" aria-hidden="true">
          <p className="card__genres">{item.genres.join(' · ')}</p>
          {item.overview && <p className="card__overview">{item.overview}</p>}
          <p className="card__specs">{specsLine(item)}</p>
          <span className="card__watch">Watch on Emby ↗</span>
        </div>
        <Badges item={item} />
      </div>
      <span className="card__title">{item.title}</span>
      {meta && <span className="card__meta">{meta}</span>}
    </a>
  )
})

function Badges({ item }: { item: CatalogItem }) {
  const badges = badgesFor(item)
  return badges.length === 0 ? null : (
    <ul className="badges">
      {badges.map((badge) => (
        <li key={badge.kind} className={`badge badge--${badge.kind}`}>
          {badge.label}
        </li>
      ))}
    </ul>
  )
}
