import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { Vector3 } from 'three'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import type { Sign } from './geometry'

const READABLE_DISTANCE = 14
const CHECK_INTERVAL_FRAMES = 15
const scratch = new Vector3()

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

export function ShelfSigns({ signs }: { signs: Sign[] }) {
  const groups = useRef<(Group | null)[]>([])
  const frame = useRef(0)
  const positions = useMemo(() => signs.map((sign) => new Vector3(...sign.position)), [signs])

  useFrame(({ camera }) => {
    frame.current = (frame.current + 1) % CHECK_INTERVAL_FRAMES
    if (frame.current !== 0) {
      return
    }
    scratch.copy(camera.position)
    positions.forEach((position, i) => {
      const group = groups.current[i]
      if (group) {
        group.visible = position.distanceTo(scratch) < READABLE_DISTANCE
      }
    })
  })

  return signs.map((sign, i) => (
    <group
      key={sign.id}
      ref={(node) => {
        groups.current[i] = node
      }}
    >
      <ShelfSign sign={sign} />
    </group>
  ))
}
