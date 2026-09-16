import { Text } from '@react-three/drei'
import type { DirectoryEntry } from '../store/layout'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'

export const DIRECTORY = { x: 2.05, y: 1.5, z: 1.05, yaw: -0.26, half: 0.4 } as const

const BOARD = { width: 1.4, height: 1.08, header: 0.18 } as const
const COLUMN_ROWS = 9

function column(entries: readonly DirectoryEntry[], key: 'genre' | 'aisle'): string {
  return entries.map((entry) => entry[key]).join('\n')
}

function Column({ entries, x }: { entries: DirectoryEntry[]; x: number }) {
  const top = BOARD.height / 2 - BOARD.header - 0.06
  return (
    <>
      <Text
        font={FONTS.display}
        position={[x, top, 0.031]}
        fontSize={0.05}
        lineHeight={1.55}
        letterSpacing={0.05}
        color={PALETTE.cream}
        anchorX="left"
        anchorY="top"
      >
        {column(entries, 'genre').toUpperCase()}
      </Text>
      <Text
        font={FONTS.display}
        position={[x + 0.54, top, 0.031]}
        fontSize={0.05}
        lineHeight={1.55}
        letterSpacing={0.04}
        color={PALETTE.gold}
        anchorX="right"
        anchorY="top"
      >
        {column(entries, 'aisle').replaceAll('Aisle ', '').toUpperCase()}
      </Text>
    </>
  )
}

export function Directory({ entries }: { entries: DirectoryEntry[] }) {
  const columns = [entries.slice(0, COLUMN_ROWS), entries.slice(COLUMN_ROWS, COLUMN_ROWS * 2)]
  return (
    <group position={[DIRECTORY.x, DIRECTORY.y, DIRECTORY.z]} rotation={[0, DIRECTORY.yaw, 0]}>
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, -0.75, -0.03]}>
          <boxGeometry args={[0.05, 1.5, 0.05]} />
          <meshLambertMaterial color={PALETTE.steel} />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[BOARD.width, BOARD.height, 0.06]} />
        <meshLambertMaterial color={PALETTE.ink} />
      </mesh>
      <mesh position={[0, BOARD.height / 2 - BOARD.header / 2, 0.031]}>
        <planeGeometry args={[BOARD.width, BOARD.header]} />
        <meshBasicMaterial color={PALETTE.rust} />
      </mesh>
      <Text
        font={FONTS.display}
        position={[0, BOARD.height / 2 - BOARD.header / 2, 0.033]}
        fontSize={0.085}
        letterSpacing={0.18}
        color={PALETTE.gold}
      >
        DIRECTORY
      </Text>
      {columns.map((entries, i) => (
        <Column key={entries[0]?.genre ?? i} entries={entries} x={-0.62 + i * 0.68} />
      ))}
    </group>
  )
}
