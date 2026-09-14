import { Link } from 'react-router'
import { embyHomeUrl } from '../api'
import type { SiteInfo } from '../catalog/types'
import { FIXTURE_IDS, FIXTURE_LABELS } from '../lobby/anchors'
import { enterStore } from '../lobby/Lobby'
import type { RigMode } from '../player/cameraRig'
import { releaseLock } from '../player/pointerLock'
import { useScene } from '../shell/sceneState'
import { ExternalMark } from './icons'

const LOBBY_HINTS: Partial<Record<RigMode, string>> = {
  counter: 'Drag to look around. Click something in the lobby, or head through the gate.',
  focus: 'Press Esc to step back to the counter.',
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
  const focus = useScene((state) => state.focus)
  const dispatch = useScene((state) => state.dispatch)
  return (
    <nav className="lobby-menu" aria-label="Lobby">
      {FIXTURE_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className="chip"
          aria-pressed={focus === id}
          onClick={() => dispatch('focus', id)}
        >
          {FIXTURE_LABELS[id]}
        </button>
      ))}
      <button type="button" className="button lobby-menu__enter" onClick={enterStore}>
        Enter the store
      </button>
    </nav>
  )
}

export function Hud({ site }: { site: SiteInfo | null }) {
  const mode = useScene((state) => state.mode)
  const hoverLabel = useScene((state) => state.hoverLabel)
  const locked = useScene((state) => state.locked)
  const selected = useScene((state) => state.selected)
  const paused = useScene((state) => state.paused)
  const inLobby = mode === 'counter' || mode === 'focus'
  const hint = mode === 'free' ? freeHint(selected !== null, locked) : LOBBY_HINTS[mode]
  return (
    <div className="hud" data-mode={mode}>
      {mode !== 'intro' && <HudBar site={site} inStore={mode === 'free' || mode === 'entering'} />}
      {mode === 'free' && locked && !paused && (
        <div className="hud__crosshair" aria-hidden="true" />
      )}
      {hoverLabel && !paused && <p className="hud__label">{hoverLabel}</p>}
      {inLobby && <LobbyMenu />}
      {hint && !paused && <p className="hud__hint">{hint}</p>}
    </div>
  )
}
