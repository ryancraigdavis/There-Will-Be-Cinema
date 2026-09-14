import { useMemo } from 'react'
import { PALETTE } from '../theme/palette'
import { carpetTexture, ceilingTexture } from '../theme/textures'
import { ROOM } from './constants'

const THICKNESS = 0.1
const WIDTH = ROOM.maxX - ROOM.minX
const DEPTH = ROOM.maxZ - ROOM.minZ
const CENTER_X = (ROOM.maxX + ROOM.minX) / 2
const CENTER_Z = (ROOM.maxZ + ROOM.minZ) / 2
const TROFFER_XS = [-4.5, -1.5, 1.5, 4.5]
const TROFFER_ZS = [-12, -9, -6, -3, 0, 3, 6]

const WALLS = [
  { key: 'left', x: ROOM.minX - THICKNESS / 2, z: CENTER_Z, length: DEPTH, yaw: Math.PI / 2 },
  { key: 'right', x: ROOM.maxX + THICKNESS / 2, z: CENTER_Z, length: DEPTH, yaw: Math.PI / 2 },
  { key: 'back', x: CENTER_X, z: ROOM.minZ - THICKNESS / 2, length: WIDTH, yaw: 0 },
  { key: 'front', x: CENTER_X, z: ROOM.maxZ + THICKNESS / 2, length: WIDTH, yaw: 0 },
]

function Wall({ x, z, length, yaw }: { x: number; z: number; length: number; yaw: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[length, 1.1, THICKNESS]} />
        <meshLambertMaterial color={PALETTE.rust} />
      </mesh>
      <mesh position={[0, 1.13, 0]}>
        <boxGeometry args={[length, 0.06, THICKNESS + 0.01]} />
        <meshLambertMaterial color={PALETTE.gold} emissive={PALETTE.gold} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 2.08, 0]}>
        <boxGeometry args={[length, 1.84, THICKNESS]} />
        <meshLambertMaterial color={PALETTE.wall} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[length, 0.1, THICKNESS + 0.02]} />
        <meshLambertMaterial color={PALETTE.ink} />
      </mesh>
    </group>
  )
}

function FrontDoor() {
  return (
    <group position={[-3.6, 0, ROOM.maxZ - 0.01]}>
      <mesh position={[0, 1.1, -0.02]}>
        <boxGeometry args={[2.1, 2.3, 0.06]} />
        <meshLambertMaterial color={PALETTE.steel} />
      </mesh>
      <mesh position={[0, 1.12, -0.06]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.9, 2.1]} />
        <meshBasicMaterial color="#0b1822" />
      </mesh>
      <mesh position={[0, 1.05, -0.08]}>
        <boxGeometry args={[1.5, 0.05, 0.04]} />
        <meshLambertMaterial color="#9a9088" />
      </mesh>
    </group>
  )
}

export function Room() {
  const carpet = useMemo(() => {
    const texture = carpetTexture()
    texture.repeat.set(WIDTH / 2.5, DEPTH / 2.5)
    return texture
  }, [])
  const ceiling = useMemo(() => {
    const texture = ceilingTexture()
    texture.repeat.set(WIDTH / 0.6, DEPTH / 0.6)
    return texture
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CENTER_X, 0, CENTER_Z]}>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshLambertMaterial map={carpet} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[CENTER_X, ROOM.height, CENTER_Z]}>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshLambertMaterial map={ceiling} />
      </mesh>
      {TROFFER_XS.flatMap((x) =>
        TROFFER_ZS.map((z) => (
          <mesh
            key={`${x}:${z}`}
            rotation={[Math.PI / 2, 0, 0]}
            position={[x, ROOM.height - 0.01, z]}
          >
            <planeGeometry args={[1.2, 0.6]} />
            <meshBasicMaterial color="#fff4dc" />
          </mesh>
        )),
      )}
      {WALLS.map(({ key, ...wall }) => (
        <Wall key={key} {...wall} />
      ))}
      <FrontDoor />
    </group>
  )
}
