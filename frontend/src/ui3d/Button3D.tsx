import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import type { Vec3 } from '../scene/math'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'

type Variant = 'primary' | 'ghost'

const COLORS: Record<
  Variant,
  Record<'rest' | 'hover', { fill: string; border: string; text: string }>
> = {
  primary: {
    rest: { fill: PALETTE.gold, border: '#8a6c06', text: PALETTE.ink },
    hover: { fill: '#ffe066', border: PALETTE.ink, text: PALETTE.ink },
  },
  ghost: {
    rest: { fill: PALETTE.ink, border: PALETTE.rust, text: PALETTE.cream },
    hover: { fill: '#1c0b07', border: PALETTE.gold, text: PALETTE.gold },
  },
}

const CLICK_SLOP_PX = 4

interface Props {
  position: Vec3
  width: number
  height: number
  label: string
  variant?: Variant
  onSelect: () => void
}

export function Button3D({ position, width, height, label, variant = 'primary', onSelect }: Props) {
  const [hovered, setHovered] = useState(false)
  const colors = COLORS[variant][hovered ? 'hover' : 'rest']

  useEffect(
    () => () => {
      document.body.style.cursor = ''
    },
    [],
  )

  const over = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }
  const out = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setHovered(false)
    document.body.style.cursor = ''
  }
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (event.delta <= CLICK_SLOP_PX) {
      onSelect()
    }
  }

  return (
    <group position={position}>
      <mesh onPointerOver={over} onPointerOut={out} onClick={click}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={colors.fill} />
      </mesh>
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[width + 0.012, height + 0.012]} />
        <meshBasicMaterial color={colors.border} />
      </mesh>
      <Text
        font={FONTS.display}
        fontSize={height * 0.44}
        letterSpacing={0.06}
        color={colors.text}
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0.003]}
      >
        {label.toUpperCase()}
      </Text>
    </group>
  )
}
