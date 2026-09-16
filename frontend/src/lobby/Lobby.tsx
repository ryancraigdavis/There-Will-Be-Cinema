import { type ComponentType, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useScreenings } from '../club/screenings'
import { releaseLock, requestLock } from '../player/pointerLock'
import { useScene } from '../shell/sceneState'
import { Button3D } from '../ui3d/Button3D'
import { Card3D, cardLayout } from '../ui3d/Card3D'
import { BULLETIN, FIXTURE_IDS, FIXTURE_LABELS, FIXTURES, type FixtureId, GATE } from './anchors'
import { cardFor } from './cards'
import { Derrick } from './Derrick'
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
import { Machines } from './Machines'

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

function openClubPage(navigate: (path: string) => void) {
  releaseLock()
  navigate('/club')
}

function FixtureCard({ id }: { id: FixtureId }) {
  const next = useScreenings((state) => state.next)
  const now = useMemo(() => new Date(), [])
  const card = cardFor(id, next, now)
  const dispatch = useScene((state) => state.dispatch)
  const navigate = useNavigate()
  const { bottom } = cardLayout(card.width, card.height)
  const buttonHeight = card.height * 0.12
  const y = bottom + buttonHeight / 2
  return (
    <Card3D {...card}>
      <Button3D
        position={[-card.width * 0.17, y, 0.004]}
        width={card.width * 0.52}
        height={buttonHeight}
        label="Club page"
        onSelect={() => openClubPage(navigate)}
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

export function Lobby() {
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
      <Derrick />
      <Machines active={!paused && mode !== 'intro' && mode !== 'entering'} />
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
      {mode === 'focus' && focus && <FixtureCard id={focus} />}
    </group>
  )
}
