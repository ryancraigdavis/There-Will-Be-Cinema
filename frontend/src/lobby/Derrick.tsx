import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'
import type { Vec3 } from '../scene/math'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import { DERRICK } from './anchors'

const HEIGHT = 2.8
const BASE = 0.5
const TOP = 0.13
const RING_HEIGHTS = [0.3, 0.58, 0.85]
const BRACE_SPANS: [number, number][] = [
  [0.02, 0.3],
  [0.3, 0.58],
  [0.58, 0.85],
]
const SIDES: [number, number][] = [
  [1, 1],
  [-1, 1],
  [-1, -1],
  [1, -1],
]
const UP = new Vector3(0, 1, 0)

function corner(height: number, sx: number, sz: number): Vec3 {
  const half = BASE + (TOP - BASE) * height
  return [sx * half, height * HEIGHT, sz * half]
}

interface BeamProps {
  from: Vec3
  to: Vec3
  thickness: number
  color: string
}

function Beam({ from, to, thickness, color }: BeamProps) {
  const beam = useMemo(() => {
    const start = new Vector3(...from)
    const end = new Vector3(...to)
    const direction = end.clone().sub(start)
    return {
      position: start.clone().add(end).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(UP, direction.clone().normalize()),
      length: direction.length(),
    }
  }, [from, to])
  return (
    <mesh position={beam.position} quaternion={beam.quaternion}>
      <boxGeometry args={[thickness, beam.length, thickness]} />
      <meshLambertMaterial color={color} />
    </mesh>
  )
}

function Legs() {
  return SIDES.map(([sx, sz]) => (
    <Beam
      key={`leg${sx}${sz}`}
      from={corner(0, sx, sz)}
      to={corner(1, sx, sz)}
      thickness={0.075}
      color={PALETTE.wood}
    />
  ))
}

function Rings() {
  return RING_HEIGHTS.flatMap((height) =>
    SIDES.map(([sx, sz], i) => {
      const [nx, nz] = SIDES[(i + 1) % SIDES.length] as [number, number]
      return (
        <Beam
          key={`ring${height}${sx}${sz}`}
          from={corner(height, sx, sz)}
          to={corner(height, nx, nz)}
          thickness={0.045}
          color={PALETTE.wood}
        />
      )
    }),
  )
}

function Braces() {
  return BRACE_SPANS.flatMap(([low, high]) =>
    SIDES.map(([sx, sz], i) => {
      const [nx, nz] = SIDES[(i + 1) % SIDES.length] as [number, number]
      return (
        <Beam
          key={`brace${low}${sx}${sz}`}
          from={corner(low, sx, sz)}
          to={corner(high, nx, nz)}
          thickness={0.032}
          color="#4b3220"
        />
      )
    }),
  )
}

export function Derrick() {
  return (
    <group position={[DERRICK.x, 0, DERRICK.z]} rotation={[0, DERRICK.yaw, 0]}>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[1.3, 0.12, 1.3]} />
        <meshLambertMaterial color={PALETTE.steel} />
      </mesh>
      <Legs />
      <Rings />
      <Braces />
      <mesh position={[0, HEIGHT + 0.07, 0]}>
        <boxGeometry args={[TOP * 2.6, 0.14, TOP * 2.6]} />
        <meshLambertMaterial color={PALETTE.steel} />
      </mesh>
      <mesh position={[0, HEIGHT + 0.2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.14, 8]} />
        <meshLambertMaterial color={PALETTE.gold} />
      </mesh>
      <group position={[0, 0.5, 0.62]} rotation={[-0.32, 0, 0]}>
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
  )
}
