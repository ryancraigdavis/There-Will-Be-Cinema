import { Link } from 'react-router'
import { embyHomeUrl } from '../api'
import { formatCount } from '../catalog/format'
import type { Catalog, SiteInfo } from '../catalog/types'
import { requestLock } from '../player/pointerLock'
import { useScene } from '../shell/sceneState'
import { backToCounter } from './Hud'
import { ExternalMark } from './icons'

interface IntroProps {
  catalog: Catalog | null
  site: SiteInfo | null
  webgl: boolean
}

export function IntroOverlay({ catalog, site, webgl }: IntroProps) {
  const mode = useScene((state) => state.mode)
  const dispatch = useScene((state) => state.dispatch)
  const count = catalog ? formatCount(catalog.items.length, 'title') : 'Counting tapes…'
  return mode !== 'intro' ? null : (
    <div className="intro">
      <div className="intro__panel">
        <h1 className="visually-hidden">There Will Be Cinema</h1>
        <img className="intro__logo" src="/logo-512.webp" alt="" width={512} height={512} />
        <p className="marquee">
          <span className="marquee__label">Now on the shelves</span>
          <span className="marquee__count">{count}</span>
        </p>
        {webgl ? (
          <button type="button" className="button intro__enter" onClick={() => dispatch('enter')}>
            Walk in
          </button>
        ) : (
          <p className="intro__note">This browser can’t draw the store. The catalog still works.</p>
        )}
        <nav className="intro__links" aria-label="Sections">
          <Link to="/search">Browse the catalog</Link>
          <a href={site ? embyHomeUrl(site) : undefined} target="_blank" rel="noopener noreferrer">
            Watch on Emby <ExternalMark />
          </a>
          <Link to="/club">Movie club</Link>
        </nav>
        <p className="intro__note">Best with a mouse and keyboard.</p>
      </div>
    </div>
  )
}

function resume() {
  const scene = useScene.getState()
  scene.setPaused(false)
  void requestLock(scene.canvas)
}

export function PauseOverlay() {
  const paused = useScene((state) => state.paused)
  const mode = useScene((state) => state.mode)
  const guide = useScene((state) => state.guide)
  return !paused || guide || mode !== 'free' ? null : (
    <div className="pause">
      <section className="pause__panel" aria-labelledby="pause-title">
        <h2 id="pause-title" className="pause__title">
          Paused
        </h2>
        <button type="button" className="button" onClick={resume}>
          Keep browsing
        </button>
        <button type="button" className="button button--ghost" onClick={backToCounter}>
          Back to the counter
        </button>
        <Link className="pause__link" to="/search">
          Search the catalog instead
        </Link>
      </section>
    </div>
  )
}
