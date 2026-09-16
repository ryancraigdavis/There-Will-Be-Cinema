import { Text } from '@react-three/drei'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import { ROOM } from './constants'
import type { Banner } from './layout'

const SIZE = { width: 2.1, height: 0.42, depth: 0.05 } as const

function Rods({ y }: { y: number }) {
  const length = ROOM.height - y - SIZE.height / 2
  return [-0.7, 0.7].map((x) => (
    <mesh key={x} position={[x, SIZE.height / 2 + length / 2, 0]}>
      <cylinderGeometry args={[0.006, 0.006, length, 6]} />
      <meshLambertMaterial color={PALETTE.steel} />
    </mesh>
  ))
}

export function Banners({ banners }: { banners: Banner[] }) {
  return banners.map((banner) => (
    <group key={banner.id} position={[...banner.position]}>
      <Rods y={banner.position[1]} />
      <mesh>
        <boxGeometry args={[SIZE.width, SIZE.height, SIZE.depth]} />
        <meshLambertMaterial color={PALETTE.rust} />
      </mesh>
      <mesh position={[0, 0, -0.006]}>
        <boxGeometry args={[SIZE.width + 0.05, SIZE.height + 0.05, 0.04]} />
        <meshBasicMaterial color={PALETTE.gold} />
      </mesh>
      {[0.031, -0.031].map((z) => (
        <group key={z} rotation={[0, z > 0 ? 0 : Math.PI, 0]}>
          <Text
            font={FONTS.display}
            position={[0, 0.1, Math.abs(z)]}
            fontSize={0.15}
            letterSpacing={0.14}
            color={PALETTE.gold}
          >
            {banner.label.toUpperCase()}
          </Text>
          <Text
            font={FONTS.display}
            position={[0, -0.09, Math.abs(z)]}
            fontSize={0.075}
            letterSpacing={0.1}
            maxWidth={SIZE.width - 0.2}
            textAlign="center"
            color={PALETTE.cream}
          >
            {banner.genres.join(' · ').toUpperCase()}
          </Text>
        </group>
      ))}
    </group>
  ))
}
