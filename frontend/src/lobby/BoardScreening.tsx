import { Text } from '@react-three/drei'
import { type ReactNode, useMemo } from 'react'
import { truncate } from '../catalog/format'
import { boardDate, relativeDay, screeningTime } from '../club/format'
import type { Poll, Screening } from '../club/types'
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

const POLL_LINES = 4
const POLL_TITLE_CHARS = 30

export function PollNote({ poll }: { poll: Poll }) {
  const shown = poll.options.slice(0, POLL_LINES)
  const extra = poll.options.length - shown.length
  const lines = [
    ...shown.map((option) => `•  ${truncate(option.title, POLL_TITLE_CHARS)}`),
    ...(extra > 0 ? [`+ ${extra} more`] : []),
  ]
  return (
    <group position={[NOTE.x, -0.2, 0.03]} rotation={[0, 0, 0.025]}>
      <Paper height={0.28} seed={59} />
      <Text
        font={FONTS.display}
        fontSize={0.025}
        letterSpacing={0.08}
        color={PALETTE.rust}
        anchorX="left"
        anchorY="top"
        position={[NOTE.left, 0.115, 0.002]}
      >
        CLUB POLL
      </Text>
      <Text
        font={FONTS.display}
        fontSize={0.032}
        lineHeight={1.05}
        maxWidth={0.45}
        color={PALETTE.ink}
        anchorX="left"
        anchorY="top"
        position={[NOTE.left, 0.08, 0.002]}
      >
        {truncate(poll.question, 70)}
      </Text>
      <Text
        font={FONTS.body}
        fontSize={0.021}
        lineHeight={1.45}
        maxWidth={0.45}
        color={PALETTE.ink}
        anchorX="left"
        anchorY="bottom"
        position={[NOTE.left, -0.12, 0.002]}
      >
        {lines.join('\n')}
      </Text>
      <Pin position={[0, 0.12, 0.01]} />
    </group>
  )
}

interface BoardProps {
  next: Screening
  later: readonly Screening[]
  poll: Poll | null
  showLater: boolean
}

function BottomNote({ later, poll, showLater }: Omit<BoardProps, 'next'>) {
  const choices: [boolean, () => ReactNode][] = [
    [poll !== null, () => <PollNote poll={poll as Poll} />],
    [showLater, () => <LaterNote later={later} />],
  ]
  return choices.find(([when]) => when)?.[1]() ?? null
}

export function BoardScreening({ next, ...rest }: BoardProps) {
  return (
    <>
      <Poster screening={next} />
      <NextNote screening={next} />
      <BottomNote {...rest} />
    </>
  )
}
