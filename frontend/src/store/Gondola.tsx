import { Text } from '@react-three/drei'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import { GONDOLA, SHELF } from './constants'
import { FACE_OFFSET, type GondolaFrame, type Section, shelfTop } from './layout'

const SIDES = [1, -1] as const
const SHELVES = Array.from({ length: SHELF.rows }, (_, shelf) => shelf)

export function Gondola({ frame }: { frame: GondolaFrame }) {
  const length = frame.frontZ - frame.backZ
  const centerZ = (frame.frontZ + frame.backZ) / 2
  const boardX = GONDOLA.divider / 2 + SHELF.depth / 2
  return (
    <group position={[frame.x, 0, centerZ]}>
      <mesh position={[0, GONDOLA.plinth / 2, 0]}>
        <boxGeometry args={[FACE_OFFSET * 2, GONDOLA.plinth, length]} />
        <meshLambertMaterial color={PALETTE.ink} />
      </mesh>
      <mesh position={[0, GONDOLA.height / 2, 0]}>
        <boxGeometry args={[GONDOLA.divider, GONDOLA.height, length]} />
        <meshLambertMaterial color="#4a1d12" />
      </mesh>
      <mesh position={[0, GONDOLA.signY, 0]}>
        <boxGeometry args={[FACE_OFFSET * 2, 0.2, length]} />
        <meshLambertMaterial color={PALETTE.ink} />
      </mesh>
      {[frame.frontZ, frame.backZ].map((z) => (
        <mesh key={z} position={[0, GONDOLA.height / 2, z - centerZ]}>
          <boxGeometry args={[FACE_OFFSET * 2 + 0.02, GONDOLA.height, 0.03]} />
          <meshLambertMaterial color={PALETTE.rust} />
        </mesh>
      ))}
      {SIDES.flatMap((side) =>
        SHELVES.map((shelf) => (
          <group key={`${side}:${shelf}`} position={[side * boardX, shelfTop(shelf), 0]}>
            <mesh position={[0, -SHELF.thickness / 2, 0]}>
              <boxGeometry args={[SHELF.depth, SHELF.thickness, length]} />
              <meshLambertMaterial color="#d9c9a6" />
            </mesh>
            <mesh position={[side * (SHELF.depth / 2 + 0.004), -0.018, 0]}>
              <boxGeometry args={[0.008, 0.036, length]} />
              <meshLambertMaterial color={PALETTE.rustBright} />
            </mesh>
          </group>
        )),
      )}
    </group>
  )
}

export function SectionSign({ section }: { section: Section }) {
  const { label, position, yaw } = section.sign
  return (
    <Text
      font={FONTS.display}
      position={[...position]}
      rotation={[0, yaw, 0]}
      fontSize={0.1}
      maxWidth={0.94}
      letterSpacing={0.08}
      textAlign="center"
      color={PALETTE.gold}
      anchorX="center"
      anchorY="middle"
    >
      {label.toUpperCase()}
    </Text>
  )
}
