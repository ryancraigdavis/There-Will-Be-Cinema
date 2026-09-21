import { Link } from 'react-router'
import { embyHomeUrl } from '../api'
import { formatCount } from '../catalog/format'
import type { Catalog, SiteInfo } from '../catalog/types'
import { requestLock } from '../player/pointerLock'
import { useScene } from '../shell/sceneState'
import { useWarmup, warmedUp } from '../shell/warmup'
import { backToCounter } from './Hud'
import { ExternalMark } from './icons'

interface IntroProps {
  catalog: Catalog | null
  site: SiteInfo | null
  webgl: boolean
}

function IntroLinks({ site }: { site: SiteInfo | null }) {
  return (
    <nav className="intro__links" aria-label="Sections">
      <Link to="/search">Browse the catalog</Link>
      <a href={site ? embyHomeUrl(site) : undefined} target="_blank" rel="noopener noreferrer">
        Watch on Emby <ExternalMark />
      </a>
    </nav>
  )
}

function EnterButton({ webgl }: { webgl: boolean }) {
  const dispatch = useScene((state) => state.dispatch)
  return webgl ? (
    <button type="button" className="button intro__enter" onClick={() => dispatch('enter')}>
      Walk in
    </button>
  ) : (
    <p className="intro__note">This browser can’t draw the store. The catalog still works.</p>
  )
}

function IntroNote({ prefix = '' }: { prefix?: string }) {
  const ready = useWarmup(warmedUp)
  return (
    <p className="intro__note" aria-live="polite">
      {prefix}
      {ready ? 'Best with a mouse and keyboard.' : 'Setting up the store…'}
    </p>
  )
}

function Marquee({ catalog }: { catalog: Catalog | null }) {
  const count = catalog ? formatCount(catalog.items.length, 'title') : 'Counting tapes…'
  return (
    <p className="marquee">
      <span className="marquee__label">Now on the shelves</span>
      <span className="marquee__count">{count}</span>
    </p>
  )
}

function StoreIntro({ catalog, site, webgl }: IntroProps) {
  return (
    <div className="intro__panel">
      <img className="intro__logo" src="/logo-512.webp" alt="" width={512} height={512} />
      <Marquee catalog={catalog} />
      <EnterButton webgl={webgl} />
      <IntroLinks site={site} />
      <IntroNote />
    </div>
  )
}

export function IntroOverlay(props: IntroProps) {
  const mode = useScene((state) => state.mode)
  return mode !== 'intro' ? null : (
    <div className="intro">
      <h1 className="visually-hidden">There Will Be Cinema</h1>
      <StoreIntro {...props} />
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
  const covered = useScene((state) => state.guide)
  return !paused || covered || mode !== 'free' ? null : (
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
