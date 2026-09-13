import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { ReactNode } from 'react'
import type { Vec3 } from '../scene/math'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'

interface Props {
  position: Vec3
  yaw?: number
  width: number
  height: number
  kicker: string
  title: string
  body: string
  children?: ReactNode
}

const swallow = (event: ThreeEvent<MouseEvent | PointerEvent>) => event.stopPropagation()

export function cardLayout(width: number, height: number) {
  const header = height * 0.14
  const pad = width * 0.07
  return { header, pad, left: -width / 2 + pad, top: height / 2, bottom: -height / 2 + pad }
}

export function Card3D({ position, yaw = 0, width, height, kicker, title, body, children }: Props) {
  const { header, pad, left, top } = cardLayout(width, height)
  const titleSize = width * 0.075
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh onClick={swallow} onPointerOver={swallow} onPointerMove={swallow}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={PALETTE.cream} />
      </mesh>
      <mesh position={[0, 0, -0.003]}>
        <planeGeometry args={[width + 0.02, height + 0.02]} />
        <meshBasicMaterial color={PALETTE.ink} />
      </mesh>
      <mesh position={[0, top - header / 2, 0.001]}>
        <planeGeometry args={[width, header]} />
        <meshBasicMaterial color={PALETTE.rust} />
      </mesh>
      <Text
        font={FONTS.display}
        fontSize={header * 0.42}
        letterSpacing={0.14}
        color={PALETTE.gold}
        anchorX="left"
        anchorY="middle"
        position={[left, top - header / 2, 0.002]}
      >
        {kicker.toUpperCase()}
      </Text>
      <Text
        font={FONTS.display}
        fontSize={titleSize}
        color={PALETTE.ink}
        anchorX="left"
        anchorY="top"
        maxWidth={width - pad * 2}
        position={[left, top - header - pad * 0.7, 0.002]}
      >
        {title}
      </Text>
      <Text
        font={FONTS.body}
        fontSize={width * 0.036}
        lineHeight={1.45}
        color="#3a2a20"
        anchorX="left"
        anchorY="top"
        maxWidth={width - pad * 2}
        position={[left, top - header - pad * 0.9 - titleSize * 1.35, 0.002]}
      >
        {body}
      </Text>
      {children}
    </group>
  )
}
