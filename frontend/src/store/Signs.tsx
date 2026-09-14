import { Text } from '@react-three/drei'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import type { Sign } from './geometry'

export function ShelfSign({ sign }: { sign: Sign }) {
  return (
    <Text
      font={FONTS.display}
      position={[...sign.position]}
      rotation={[0, sign.yaw, 0]}
      fontSize={sign.size}
      maxWidth={sign.maxWidth}
      letterSpacing={0.08}
      textAlign="center"
      color={PALETTE.gold}
      anchorX="center"
      anchorY="middle"
    >
      {sign.label.toUpperCase()}
    </Text>
  )
}
