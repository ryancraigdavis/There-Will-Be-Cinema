import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { truncate } from '../catalog/format'
import { boardDate, relativeDay, screeningTime } from '../club/format'
import type { Screening } from '../club/types'
import type { Vec3 } from '../scene/math'
import { useTexture } from '../store/atlasTextures'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import { noteTexture } from '../theme/textures'

const POSTER = { width: 0.3, height: 0.45, x: -0.29, y: -0.01, tilt: 0.025 } as const
const NOTE = { width: 0.5, x: 0.215, left: -0.225 } as const
const LATER_LIMIT = 3
const LATER_TITLE_CHARS = 24

function Pin({ position, color = PALETTE.rustBright }: { position: Vec3; color?: string }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.012, 10, 8]} />
      <meshLambertMaterial color={color} />
    </mesh>
  )
}

function Poster({ screening }: { screening: Screening }) {
  const texture = useTexture(screening.posterUrl)
  return (
    <group position={[POSTER.x, POSTER.y, 0.03]} rotation={[0, 0, POSTER.tilt]}>
      <mesh>
        <planeGeometry args={[POSTER.width, POSTER.height]} />
        <meshLambertMaterial
          key={texture ? 'poster' : 'blank'}
          map={texture}
          color={texture ? '#ffffff' : PALETTE.ink}
        />
      </mesh>
      {texture ? null : (
        <Text
          font={FONTS.display}
          position={[0, 0, 0.002]}
          fontSize={0.04}
          maxWidth={POSTER.width - 0.05}
          textAlign="center"
          color={PALETTE.gold}
        >
          {screening.title.toUpperCase()}
        </Text>
      )}
      <Pin position={[0, POSTER.height / 2 - 0.025, 0.01]} color={PALETTE.gold} />
    </group>
  )
}

function Paper({ height, seed }: { height: number; seed: number }) {
  const paper = useMemo(() => noteTexture([], seed), [seed])
  return (
    <mesh>
      <planeGeometry args={[NOTE.width, height]} />
      <meshLambertMaterial map={paper} />
    </mesh>
  )
}

function NextNote({ screening }: { screening: Screening }) {
  const now = useMemo(() => new Date(), [])
  const soon = relativeDay(screening.startsAt, now)
  const kicker = soon === null ? 'NEXT SCREENING' : `NEXT SCREENING · ${soon.toUpperCase()}`
  const when = `${boardDate(screening.startsAt)} · ${screeningTime(screening.startsAt)}`
  return (
    <group position={[NOTE.x, 0.165, 0.03]} rotation={[0, 0, -0.02]}>
      <Paper height={0.33} seed={31} />
      <Text
        font={FONTS.display}
        fontSize={0.025}
        letterSpacing={0.08}
        color={PALETTE.rust}
        anchorX="left"
        anchorY="top"
        position={[NOTE.left, 0.14, 0.002]}
      >
        {kicker}
      </Text>
      <Text
        font={FONTS.display}
        fontSize={0.05}
        lineHeight={1.02}
        maxWidth={0.45}
        color={PALETTE.ink}
        anchorX="left"
        anchorY="top"
        position={[NOTE.left, 0.1, 0.002]}
      >
        {screening.title}
      </Text>
      <Text
        font={FONTS.body}
        fontSize={0.023}
        color={PALETTE.ink}
        anchorX="left"
        anchorY="bottom"
        position={[NOTE.left, -0.1, 0.002]}
      >
        {when}
      </Text>
      <Text
        font={FONTS.body}
        fontSize={0.021}
        maxWidth={0.45}
        color="#5a4636"
        anchorX="left"
        anchorY="bottom"
        position={[NOTE.left, -0.14, 0.002]}
      >
        {screening.location ?? ''}
      </Text>
      <Pin position={[0, 0.145, 0.01]} />
    </group>
  )
}

function LaterNote({ later }: { later: readonly Screening[] }) {
  const lines = later
    .slice(0, LATER_LIMIT)
    .map((s) => `${boardDate(s.startsAt)}   ${truncate(s.title, LATER_TITLE_CHARS)}`)
  return (
    <group position={[NOTE.x, -0.2, 0.03]} rotation={[0, 0, 0.03]}>
      <Paper height={0.26} seed={47} />
      <Text
        font={FONTS.display}
        fontSize={0.025}
        letterSpacing={0.08}
        color={PALETTE.rust}
        anchorX="left"
        anchorY="top"
        position={[NOTE.left, 0.105, 0.002]}
      >
        COMING UP
      </Text>
      <Text
        font={FONTS.body}
        fontSize={0.023}
        lineHeight={1.55}
        maxWidth={0.45}
        color={PALETTE.ink}
        anchorX="left"
        anchorY="top"
        position={[NOTE.left, 0.065, 0.002]}
      >
        {lines.length === 0 ? 'More dates soon.' : lines.join('\n')}
      </Text>
      <Pin position={[0, 0.11, 0.01]} color={PALETTE.gold} />
    </group>
  )
}

export function BoardScreening({ next, later }: { next: Screening; later: readonly Screening[] }) {
  return (
    <>
      <Poster screening={next} />
      <NextNote screening={next} />
      <LaterNote later={later} />
    </>
  )
}
