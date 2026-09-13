import type { ComponentType } from 'react'
import type { SiteInfo } from '../catalog/types'
import { requestLock } from '../player/pointerLock'
import { useScene } from '../shell/sceneState'
import { Button3D } from '../ui3d/Button3D'
import { Card3D, cardLayout } from '../ui3d/Card3D'
import { BULLETIN, FIXTURE_IDS, FIXTURE_LABELS, FIXTURES, type FixtureId, GATE } from './anchors'
import { CARDS } from './cards'
import {
  BulletinBoard,
  Counter,
  CounterGear,
  EntryGate,
  HangingLogo,
  SuggestionBox,
  Telephone,
} from './Fixtures'
import { type Glow, Hotspot } from './Hotspot'

const MODELS: Record<FixtureId, ComponentType> = {
  bulletin: BulletinBoard,
  suggestion: SuggestionBox,
  telephone: Telephone,
}

const GLOWS: Record<FixtureId, Glow> = {
  bulletin: {
    center: [BULLETIN.x, BULLETIN.y, BULLETIN.z],
    size: [1.34, 1.08, 0.12],
    yaw: BULLETIN.yaw,
  },
  suggestion: {
    center: [FIXTURES.suggestion[0], FIXTURES.suggestion[1] + 0.15, FIXTURES.suggestion[2]],
    size: [0.4, 0.38, 0.36],
  },
  telephone: {
    center: [FIXTURES.telephone[0], FIXTURES.telephone[1] + 0.08, FIXTURES.telephone[2]],
    size: [0.36, 0.2, 0.34],
  },
}

const GATE_GLOW: Glow = {
  center: [GATE.x, 1.35, GATE.z],
  size: [GATE.halfWidth * 2 + 0.3, 2.75, 0.25],
}

export function enterStore() {
  const scene = useScene.getState()
  scene.dispatch('walk')
  void requestLock(scene.canvas)
}

function openClub(site: SiteInfo | null) {
  if (site) {
    window.open(site.clubUrl, '_blank', 'noopener,noreferrer')
  }
}

function FixtureCard({ id, site }: { id: FixtureId; site: SiteInfo | null }) {
  const card = CARDS[id]
  const dispatch = useScene((state) => state.dispatch)
  const { bottom } = cardLayout(card.width, card.height)
  const buttonHeight = card.height * 0.12
  const y = bottom + buttonHeight / 2
  return (
    <Card3D {...card}>
      <Button3D
        position={[-card.width * 0.17, y, 0.004]}
        width={card.width * 0.52}
        height={buttonHeight}
        label="Open club site"
        onSelect={() => openClub(site)}
      />
      <Button3D
        position={[card.width * 0.3, y, 0.004]}
        width={card.width * 0.28}
        height={buttonHeight}
        label="Back"
        variant="ghost"
        onSelect={() => dispatch('back')}
      />
    </Card3D>
  )
}

export function Lobby({ site }: { site: SiteInfo | null }) {
  const mode = useScene((state) => state.mode)
  const focus = useScene((state) => state.focus)
  const paused = useScene((state) => state.paused)
  const dispatch = useScene((state) => state.dispatch)
  const inLobby = !paused && (mode === 'counter' || mode === 'focus')
  return (
    <group>
      <Counter />
      <CounterGear />
      <HangingLogo />
      {FIXTURE_IDS.map((id) => {
        const Model = MODELS[id]
        return (
          <Hotspot
            key={id}
            label={FIXTURE_LABELS[id]}
            glow={GLOWS[id]}
            active={inLobby && focus !== id}
            onSelect={() => dispatch('focus', id)}
          >
            <Model />
          </Hotspot>
        )
      })}
      <Hotspot label="Enter the store" glow={GATE_GLOW} active={inLobby} onSelect={enterStore}>
        <EntryGate />
      </Hotspot>
      {mode === 'focus' && focus && <FixtureCard id={focus} site={site} />}
    </group>
  )
}
