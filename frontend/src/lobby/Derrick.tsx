import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import { Instanced } from '../ui3d/Instanced'
import { DERRICK, GATE } from './anchors'
import { DERRICK_SHAPE, derrickBeams } from './derrick'

const HEIGHT = DERRICK_SHAPE.height
const TOP = DERRICK_SHAPE.top
const PLAQUE = {
  out: 0.62,
  y: 0.5,
  yaw: Math.atan2(GATE.x - DERRICK.x, GATE.z - DERRICK.z) - DERRICK.yaw,
} as const

function Beams() {
  const beams = useMemo(derrickBeams, [])
  return (
    <Instanced name="derrick-beams" transforms={beams}>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial />
    </Instanced>
  )
}

export function Derrick() {
  return (
    <group position={[DERRICK.x, 0, DERRICK.z]} rotation={[0, DERRICK.yaw, 0]}>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[1.3, 0.12, 1.3]} />
        <meshLambertMaterial color={PALETTE.steel} />
      </mesh>
      <Beams />
      <mesh position={[0, HEIGHT + 0.07, 0]}>
        <boxGeometry args={[TOP * 2.6, 0.14, TOP * 2.6]} />
        <meshLambertMaterial color={PALETTE.steel} />
      </mesh>
      <mesh position={[0, HEIGHT + 0.2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.14, 8]} />
        <meshLambertMaterial color={PALETTE.gold} />
      </mesh>
      <group
        position={[Math.sin(PLAQUE.yaw) * PLAQUE.out, PLAQUE.y, Math.cos(PLAQUE.yaw) * PLAQUE.out]}
        rotation={[0, PLAQUE.yaw, 0]}
      >
        <group rotation={[-0.32, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 0.26, 0.03]} />
            <meshLambertMaterial color={PALETTE.ink} />
          </mesh>
          <Text
            font={FONTS.display}
            position={[0, 0, 0.02]}
            fontSize={0.052}
            letterSpacing={0.1}
            maxWidth={0.44}
            textAlign="center"
            color={PALETTE.gold}
          >
            THERE WILL BE BLOOD
          </Text>
        </group>
      </group>
    </group>
  )
}
