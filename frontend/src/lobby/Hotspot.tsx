import type { ThreeEvent } from '@react-three/fiber'
import { type ReactNode, useEffect, useState } from 'react'
import type { Vec3 } from '../scene/math'
import { useScene } from '../shell/sceneState'
import { PALETTE } from '../theme/palette'

export interface Glow {
  center: Vec3
  size: Vec3
  yaw?: number
}

interface Props {
  label: string
  glow: Glow
  active: boolean
  onSelect: () => void
  children: ReactNode
}

const CLICK_SLOP_PX = 4
const noRaycast = () => null

export function Hotspot({ label, glow, active, onSelect, children }: Props) {
  const [hovered, setHovered] = useState(false)
  const lit = hovered && active

  useEffect(() => {
    if (!active) {
      setHovered(false)
    }
  }, [active])

  const over = (event: ThreeEvent<PointerEvent>) => {
    if (active) {
      event.stopPropagation()
      setHovered(true)
      useScene.getState().setHover(label)
      document.body.style.cursor = 'pointer'
    }
  }
  const out = () => {
    setHovered(false)
    document.body.style.cursor = ''
    if (useScene.getState().hoverLabel === label) {
      useScene.getState().setHover(null)
    }
  }
  const click = (event: ThreeEvent<MouseEvent>) => {
    if (active && event.delta <= CLICK_SLOP_PX) {
      event.stopPropagation()
      out()
      onSelect()
    }
  }

  return (
    <group onPointerOver={over} onPointerOut={out} onClick={click}>
      {children}
      <mesh
        visible={lit}
        raycast={noRaycast}
        position={[...glow.center]}
        rotation={[0, glow.yaw ?? 0, 0]}
      >
        <boxGeometry args={[...glow.size]} />
        <meshBasicMaterial color={PALETTE.gold} transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  )
}
