import { useState } from 'react'
import { requestLock } from '../player/pointerLock'
import { useScene } from '../shell/sceneState'
import { FIXTURES, GATE } from './anchors'
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

const PHONE_GLOW: Glow = {
  center: [FIXTURES.telephone[0], FIXTURES.telephone[1] + 0.08, FIXTURES.telephone[2]],
  size: [0.36, 0.2, 0.34],
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

function RingingPhone({ active }: { active: boolean }) {
  const [rings, setRings] = useState(0)
  return (
    <Hotspot
      label="Counter phone"
      glow={PHONE_GLOW}
      active={active}
      onSelect={() => setRings((count) => count + 1)}
    >
      <Telephone rings={rings} />
    </Hotspot>
  )
}

export function Lobby() {
  const mode = useScene((state) => state.mode)
  const paused = useScene((state) => state.paused)
  const inLobby = !paused && mode === 'counter'
  // Props you can fiddle with stay live while you walk, the way the machines always have.
  const propsLive = !paused && mode !== 'intro' && mode !== 'entering'
  return (
    <group>
      <Counter />
      <CounterGear />
      <HangingLogo />
      <Derrick />
      <Machines active={propsLive} />
      <BulletinBoard />
      <SuggestionBox />
      <RingingPhone active={propsLive} />
      <Hotspot label="Enter the store" glow={GATE_GLOW} active={inLobby} onSelect={enterStore}>
        <EntryGate />
      </Hotspot>
    </group>
  )
}
