import { PALETTE } from '../theme/palette'
import type { Banner } from './layout'
import { BANNER_SIZE, ROD_XS, rodLength } from './signText'

function Rods({ y }: { y: number }) {
  const length = rodLength(y)
  return ROD_XS.map((x) => (
    <mesh key={x} position={[x, BANNER_SIZE.height / 2 + length / 2, 0]}>
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
        <boxGeometry args={[BANNER_SIZE.width, BANNER_SIZE.height, BANNER_SIZE.depth]} />
        <meshLambertMaterial color={PALETTE.rust} />
      </mesh>
      <mesh position={[0, 0, -0.006]}>
        <boxGeometry args={[BANNER_SIZE.width + 0.05, BANNER_SIZE.height + 0.05, 0.04]} />
        <meshBasicMaterial color={PALETTE.gold} />
      </mesh>
    </group>
  ))
}
