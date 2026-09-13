import './home.css'
import { Link } from 'react-router'
import { embyHomeUrl } from '../api'
import { formatCount } from '../catalog/format'
import { readyValue, useCatalog, useSite } from '../catalog/resources'

export function HomePage() {
  const site = readyValue(useSite())
  const catalog = readyValue(useCatalog())
  const count = catalog ? formatCount(catalog.items.length, 'title') : 'Counting tapes…'
  return (
    <main className="home">
      <section className="home__hero">
        <h1 className="visually-hidden">There Will Be Cinema</h1>
        <img className="home__logo" src="/logo-512.webp" alt="" width={512} height={512} />
        <p className="marquee">
          <span className="marquee__label">Now on the shelves</span>
          <span className="marquee__count">{count}</span>
        </p>
      </section>
      <nav className="doors" aria-label="Sections">
        <Link className="door" to="/search">
          <span className="door__kicker">Search</span>
          <span className="door__title">The Catalog</span>
          <span className="door__hint">
            Every film and series, by title, genre, year, and format.
          </span>
        </Link>
        <a
          className="door"
          href={site ? embyHomeUrl(site) : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="door__kicker">Stream</span>
          <span className="door__title">Emby</span>
          <span className="door__hint">Press play on anything in the collection.</span>
        </a>
        <Link className="door" to="/club">
          <span className="door__kicker">Join</span>
          <span className="door__title">Movie Club</span>
          <span className="door__hint">The schedule, suggestions, and RSVPs.</span>
        </Link>
      </nav>
      <p className="home__note">The walk-in store is still being stocked. Pardon the boxes.</p>
    </main>
  )
}
