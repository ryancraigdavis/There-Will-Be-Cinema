import type { ThreeEvent } from '@react-three/fiber'
import { type ReactNode, useMemo } from 'react'
import { PALETTE } from '../theme/palette'
import { carpetTexture, ceilingTexture } from '../theme/textures'
import { Instanced } from '../ui3d/Instanced'
import { ROOM } from './constants'
import { bandTransforms, TROFFER, trofferTransforms, WALL_BANDS, type WallBand } from './room'

const blockPointer = (event: ThreeEvent<MouseEvent | PointerEvent>) => event.stopPropagation()
const WIDTH = ROOM.maxX - ROOM.minX
const DEPTH = ROOM.maxZ - ROOM.minZ
const CENTER_X = (ROOM.maxX + ROOM.minX) / 2
const CENTER_Z = (ROOM.maxZ + ROOM.minZ) / 2

const BAND_MATERIALS: Record<WallBand['id'], ReactNode> = {
  lower: <meshLambertMaterial color={PALETTE.rust} />,
  trim: (
    <meshLambertMaterial color={PALETTE.gold} emissive={PALETTE.gold} emissiveIntensity={0.2} />
  ),
  upper: <meshLambertMaterial color={PALETTE.wall} />,
  base: <meshLambertMaterial color={PALETTE.ink} />,
}

function Walls() {
  const bands = useMemo(
    () => WALL_BANDS.map((band) => ({ band, transforms: bandTransforms(band) })),
    [],
  )
  return bands.map(({ band, transforms }) => (
    <Instanced key={band.id} name={`wall-${band.id}`} transforms={transforms}>
      <boxGeometry args={[1, 1, 1]} />
      {BAND_MATERIALS[band.id]}
    </Instanced>
  ))
}

function Troffers() {
  const transforms = useMemo(trofferTransforms, [])
  return (
    <Instanced name="troffers" transforms={transforms}>
      <planeGeometry args={[...TROFFER.size]} />
      <meshBasicMaterial color="#fff4dc" />
    </Instanced>
  )
}

const DOOR_X = 0.6

function FrontDoor() {
  return (
    <group position={[DOOR_X, 0, ROOM.maxZ - 0.01]}>
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
    <group
      name="room"
      onPointerOver={blockPointer}
      onPointerMove={blockPointer}
      onClick={blockPointer}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CENTER_X, 0, CENTER_Z]}>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshLambertMaterial map={carpet} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[CENTER_X, ROOM.height, CENTER_Z]}>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshLambertMaterial map={ceiling} />
      </mesh>
      <Troffers />
      <Walls />
      <FrontDoor />
    </group>
  )
}
