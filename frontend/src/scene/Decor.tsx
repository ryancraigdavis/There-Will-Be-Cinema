import { Text } from '@react-three/drei'
import { useTexture } from '../store/atlasTextures'
import { ROOM } from '../store/constants'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import type { Vec3 } from './math'

interface Artwork {
  id: string
  url: string
  caption: string
  position: Vec3
  yaw: number
  width: number
  height: number
}

const BACK_Z = ROOM.minZ + 0.08
const RIGHT_X = ROOM.maxX - 0.08

export const ARTWORK: readonly Artwork[] = [
  {
    id: 'boomtown',
    url: '/art-boomtown.webp',
    caption: 'Boom Town, 1928',
    position: [-3.2, 2.45, BACK_Z],
    yaw: 0,
    width: 0.82,
    height: 0.71,
  },
  {
    id: 'erosion',
    url: '/art-erosion.webp',
    caption: 'Erosion Laid Bare',
    position: [3.2, 2.45, BACK_Z],
    yaw: 0,
    width: 0.95,
    height: 0.68,
  },
  {
    id: 'blood',
    url: '/art-blood.webp',
    caption: 'There Will Be Blood, 2007',
    position: [RIGHT_X, 1.75, 5.9],
    yaw: -Math.PI / 2,
    width: 0.78,
    height: 1.17,
  },
  {
    id: 'pta',
    url: '/art-pta.webp',
    caption: 'Paul Thomas Anderson',
    position: [RIGHT_X, 1.62, 7.05],
    yaw: -Math.PI / 2,
    width: 0.92,
    height: 0.52,
  },
]

const FRAME = { border: 0.05, depth: 0.05, captionDrop: 0.06 } as const

function Framed({ art }: { art: Artwork }) {
  const picture = useTexture(art.url)
  return (
    <group position={[...art.position]} rotation={[0, art.yaw, 0]}>
      <mesh>
        <boxGeometry
          args={[art.width + FRAME.border * 2, art.height + FRAME.border * 2, FRAME.depth]}
        />
        <meshLambertMaterial color={PALETTE.wood} />
      </mesh>
      <mesh position={[0, 0, FRAME.depth / 2 + 0.002]}>
        <planeGeometry args={[art.width, art.height]} />
        <meshLambertMaterial
          key={picture ? 'art' : 'blank'}
          map={picture}
          color={picture ? '#ffffff' : PALETTE.ember}
        />
      </mesh>
      <Text
        font={FONTS.display}
        position={[0, -art.height / 2 - FRAME.border - FRAME.captionDrop, FRAME.depth / 2]}
        fontSize={0.055}
        letterSpacing={0.1}
        color={PALETTE.sunset}
        maxWidth={art.width + 0.4}
        textAlign="center"
      >
        {art.caption.toUpperCase()}
      </Text>
    </group>
  )
}

function BackWallSign() {
  return (
    <group position={[0, 2.58, BACK_Z]}>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[4.3, 0.62, 0.05]} />
        <meshBasicMaterial color={PALETTE.gold} />
      </mesh>
      <mesh>
        <boxGeometry args={[4.2, 0.52, 0.06]} />
        <meshLambertMaterial color={PALETTE.rust} />
      </mesh>
      <Text
        font={FONTS.display}
        position={[0, 0, 0.035]}
        fontSize={0.26}
        letterSpacing={0.18}
        color={PALETTE.gold}
      >
        THERE WILL BE CINEMA
      </Text>
      <mesh position={[0, -0.36, 0.02]}>
        <boxGeometry args={[4.2, 0.03, 0.03]} />
        <meshBasicMaterial color="#ffd98a" />
      </mesh>
    </group>
  )
}

export function Decor() {
  return (
    <>
      <BackWallSign />
      {ARTWORK.map((art) => (
        <Framed key={art.id} art={art} />
      ))}
    </>
  )
}
