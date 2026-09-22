import { Link } from 'react-router'
import { embyHomeUrl } from '../api'
import type { SiteInfo } from '../catalog/types'
import { enterStore } from '../lobby/Lobby'
import type { RigMode } from '../player/cameraRig'
import { releaseLock } from '../player/pointerLock'
import { useScene } from '../shell/sceneState'
import { openGuide } from './Guide'
import { ExternalMark } from './icons'

const LOBBY_HINTS: Partial<Record<RigMode, string>> = {
  counter: 'Drag to look around. Try the machines or the phone, or head through the gate.',
}

const coarsePointer = () => window.matchMedia?.('(pointer: coarse)').matches ?? false

function freeHint(selected: boolean, locked: boolean): string {
  const hints = [
    [selected, 'Walk away or press Esc to put the tape back.'],
    [coarsePointer(), 'Left stick to walk · Drag to look · Tap a tape'],
    [locked, 'WASD to walk · Shift to run · Click a tape · Esc to pause'],
    [true, 'WASD to walk · Drag to look · Click a tape · Esc to pause'],
  ] as const
  return hints.find(([when]) => when)?.[1] ?? ''
}

export function backToCounter() {
  useScene.getState().dispatch('back')
  releaseLock()
}

function HudBar({ site, inStore }: { site: SiteInfo | null; inStore: boolean }) {
  return (
    <div className="hud__bar">
      <Link to="/search" className="hud__brand">
        <img src="/logo-128.webp" alt="" width={36} height={36} />
        <span>Catalog</span>
      </Link>
      <div className="hud__links">
        <button type="button" className="chip" onClick={openGuide}>
          Find a movie · M
        </button>
        {inStore && (
          <button type="button" className="chip" onClick={backToCounter}>
            Back to the counter
          </button>
        )}
        <a
          className="chip"
          href={site ? embyHomeUrl(site) : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          Emby <ExternalMark />
        </a>
      </div>
    </div>
  )
}

function LobbyMenu() {
  return (
    <nav className="lobby-menu" aria-label="Lobby">
      <button type="button" className="button lobby-menu__enter" onClick={enterStore}>
        Enter the store
      </button>
    </nav>
  )
}

function HoverLabel() {
  const hoverLabel = useScene((state) => state.hoverLabel)
  const paused = useScene((state) => state.paused)
  return hoverLabel && !paused ? <p className="hud__label">{hoverLabel}</p> : null
}

export function Hud({ site }: { site: SiteInfo | null }) {
  const mode = useScene((state) => state.mode)
  const locked = useScene((state) => state.locked)
  const selected = useScene((state) => state.selected)
  const paused = useScene((state) => state.paused)
  const inLobby = mode === 'counter'
  const hint = mode === 'free' ? freeHint(selected !== null, locked) : LOBBY_HINTS[mode]
  return (
    <div className="hud" data-mode={mode}>
      {mode !== 'intro' && <HudBar site={site} inStore={mode === 'free' || mode === 'entering'} />}
      {mode === 'free' && locked && !paused && (
        <div className="hud__crosshair" aria-hidden="true" />
      )}
      <HoverLabel />
      {inLobby && <LobbyMenu />}
      {hint && !paused && <p className="hud__hint">{hint}</p>}
    </div>
  )
}
