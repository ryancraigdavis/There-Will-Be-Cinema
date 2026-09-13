import { Link, NavLink } from 'react-router'
import { embyHomeUrl } from '../api'
import { readyValue, useSite } from '../catalog/resources'
import { ExternalMark } from './icons'

export function SiteHeader() {
  const site = readyValue(useSite())
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="brand">
          <img src="/logo-128.webp" alt="" width={40} height={40} />
          <span className="brand__name">There Will Be Cinema</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <NavLink to="/search" className="site-nav__link">
            Catalog
          </NavLink>
          <a
            className="site-nav__link"
            href={site ? embyHomeUrl(site) : undefined}
            target="_blank"
            rel="noopener noreferrer"
          >
            Emby <ExternalMark />
          </a>
          <NavLink to="/club" className="site-nav__link">
            Club
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
