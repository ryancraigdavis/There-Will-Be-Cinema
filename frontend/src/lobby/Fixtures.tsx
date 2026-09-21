import { Text } from '@react-three/drei'
import { type ThreeEvent, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  CatmullRomCurve3,
  DoubleSide,
  type Group,
  type Texture,
  TubeGeometry,
  Vector3,
} from 'three'
import { posterUrl } from '../api'
import { readyValue, useCatalog, useCollections } from '../catalog/resources'
import { useTexture } from '../store/atlasTextures'
import { ROOM } from '../store/constants'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import { corkTexture, crtTexture, noteTexture } from '../theme/textures'
import { BULLETIN, COUNTER, FIXTURES, GATE } from './anchors'
import { bestPictureFilms, pickFilm } from './nowPlaying'

const blockPointer = (event: ThreeEvent<MouseEvent | PointerEvent>) => event.stopPropagation()

const HANDSET_Y = 0.1
const RING = {
  seconds: 1.8,
  burst: 0.55,
  gap: 0.8,
  rate: 38,
  lift: 0.022,
  tilt: 0.28,
  sway: 0.008,
} as const

export function Counter() {
  const { minX, maxX, minZ, maxZ, height } = COUNTER
  const width = maxX - minX
  const depth = maxZ - minZ
  return (
    <group
      name="counter"
      position={[(minX + maxX) / 2, 0, (minZ + maxZ) / 2]}
      onPointerOver={blockPointer}
      onPointerMove={blockPointer}
      onClick={blockPointer}
    >
      <mesh position={[0, (height - 0.04) / 2, 0]}>
        <boxGeometry args={[width, height - 0.04, depth]} />
        <meshLambertMaterial color={PALETTE.rust} />
      </mesh>
      <mesh position={[0, 0.06, depth / 2 + 0.004]}>
        <boxGeometry args={[width, 0.12, 0.01]} />
        <meshLambertMaterial color={PALETTE.ink} />
      </mesh>
      <mesh position={[0, 0.66, depth / 2 + 0.006]}>
        <boxGeometry args={[width, 0.05, 0.01]} />
        <meshLambertMaterial color={PALETTE.gold} emissive={PALETTE.gold} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, height - 0.02, 0.03]}>
        <boxGeometry args={[width + 0.08, 0.04, depth + 0.1]} />
        <meshLambertMaterial color={PALETTE.laminate} />
      </mesh>
      <Text
        font={FONTS.display}
        position={[0, 0.4, depth / 2 + 0.012]}
        fontSize={0.12}
        letterSpacing={0.2}
        color={PALETTE.gold}
      >
        RENTALS · RETURNS
      </Text>
    </group>
  )
}

export function CounterGear() {
  const screen = useMemo(() => crtTexture(), [])
  return (
    <>
      <group position={[...FIXTURES.crt]}>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.24, 0.04, 0.24]} />
          <meshLambertMaterial color="#8f846e" />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.4]} />
          <meshLambertMaterial color="#cfc2a4" />
        </mesh>
        <mesh position={[0, 0.23, 0.201]}>
          <planeGeometry args={[0.32, 0.25]} />
          <meshBasicMaterial map={screen} />
        </mesh>
      </group>
      <group position={[...FIXTURES.register]}>
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.34, 0.14, 0.32]} />
          <meshLambertMaterial color={PALETTE.steel} />
        </mesh>
        <mesh position={[0, 0.19, -0.06]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.24, 0.08, 0.02]} />
          <meshLambertMaterial color="#0e1a10" emissive="#3f8f3f" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </>
  )
}

export function HangingLogo() {
  const logo = useTexture('/logo-512.webp')
  const [x, y, z] = FIXTURES.logo
  const radius = 0.5
  const rodLength = ROOM.height - (y + radius)
  return (
    <group position={[x, y, z]}>
      {[-0.3, 0.3].map((dx) => (
        <mesh key={dx} position={[dx, radius + rodLength / 2 - 0.08, 0]}>
          <cylinderGeometry args={[0.006, 0.006, rodLength + 0.16, 6]} />
          <meshLambertMaterial color={PALETTE.steel} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius + 0.04, radius + 0.04, 0.05, 48]} />
        <meshLambertMaterial color={PALETTE.rust} />
      </mesh>
      <mesh>
        <torusGeometry args={[radius + 0.045, 0.022, 8, 64]} />
        <meshBasicMaterial color={PALETTE.gold} />
      </mesh>
      {[0, Math.PI].map((yaw) => (
        <mesh key={yaw} rotation={[0, yaw, 0]} position={[0, 0, yaw === 0 ? 0.027 : -0.027]}>
          <circleGeometry args={[radius, 64]} />
          <meshBasicMaterial
            key={logo ? 'logo' : 'blank'}
            map={logo}
            color={logo ? '#ffffff' : PALETTE.rustBright}
            transparent
          />
        </mesh>
      ))}
    </group>
  )
}

const NOTES = [
  {
    lines: ['MEMBERS', 'card required', 'for new', 'releases'],
    x: 0.08,
    y: -0.14,
    tilt: -0.04,
  },
  {
    lines: ['BE KIND', 'REWIND', 'or it is a', 'dollar'],
    x: 0.38,
    y: 0.12,
    tilt: 0.07,
  },
]

function PinnedNotes() {
  const notes = useMemo(() => NOTES.map((note, i) => noteTexture(note.lines, i + 11)), [])
  return (
    <>
      {NOTES.map((note, i) => (
        <PinnedNote key={note.lines[0]} note={note} texture={notes[i]} index={i} />
      ))}
    </>
  )
}

function PinnedNote({
  note,
  texture,
  index,
}: {
  note: (typeof NOTES)[number]
  texture: Texture | undefined
  index: number
}) {
  return (
    <group position={[note.x, note.y, 0.03]} rotation={[0, 0, note.tilt]}>
      <mesh>
        <planeGeometry args={[0.3, 0.3]} />
        <meshLambertMaterial map={texture ?? null} />
      </mesh>
      <mesh position={[0, 0.13, 0.01]}>
        <sphereGeometry args={[0.012, 10, 8]} />
        <meshLambertMaterial color={index % 2 ? PALETTE.gold : PALETTE.rustBright} />
      </mesh>
    </group>
  )
}

export function BulletinBoard() {
  const cork = useMemo(() => corkTexture(), [])
  return (
    <group
      position={[...FIXTURES.bulletin]}
      rotation={[0, BULLETIN.yaw, 0]}
      onPointerOver={blockPointer}
      onPointerMove={blockPointer}
      onClick={blockPointer}
    >
      {[-0.56, 0.56].map((x) => (
        <mesh key={x} position={[x, -0.5, -0.03]}>
          <boxGeometry args={[0.05, 1.9, 0.05]} />
          <meshLambertMaterial color={PALETTE.wood} />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[1.24, 0.9, 0.05]} />
        <meshLambertMaterial color={PALETTE.wood} />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[1.12, 0.78]} />
        <meshLambertMaterial map={cork} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[1.24, 0.15, 0.06]} />
        <meshLambertMaterial color={PALETTE.rust} />
      </mesh>
      <Text
        font={FONTS.display}
        position={[0, 0.52, 0.032]}
        fontSize={0.085}
        letterSpacing={0.18}
        color={PALETTE.gold}
      >
        NOW PLAYING
      </Text>
      <NowPlayingPoster />
      <PinnedNotes />
    </group>
  )
}

const POSTER = { width: 0.34, height: 0.51, x: -0.3, y: 0.02 }

function NowPlayingPoster() {
  const catalog = readyValue(useCatalog())
  const collections = readyValue(useCollections())
  const films = useMemo(() => bestPictureFilms(collections, catalog), [collections, catalog])
  // One winner per visit, chosen when the shelf of candidates first arrives.
  const roll = useMemo(() => Math.random(), [])
  const film = pickFilm(films, roll)
  const texture = useTexture(film ? posterUrl(film) : null)
  if (!film || !texture) {
    return null
  }
  return (
    <group position={[POSTER.x, POSTER.y, 0.03]}>
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[POSTER.width + 0.02, POSTER.height + 0.02]} />
        <meshBasicMaterial color={PALETTE.cream} />
      </mesh>
      <mesh>
        <planeGeometry args={[POSTER.width, POSTER.height]} />
        {/* the map arrives after mount, so the material needs a key tied to it */}
        <meshBasicMaterial key={texture.uuid} map={texture} />
      </mesh>
      <mesh position={[0, POSTER.height / 2 + 0.012, 0.004]}>
        <sphereGeometry args={[0.012, 10, 8]} />
        <meshLambertMaterial color={PALETTE.rustBright} />
      </mesh>
      <Text
        font={FONTS.display}
        position={[0, -POSTER.height / 2 - 0.045, 0.004]}
        fontSize={0.035}
        maxWidth={POSTER.width + 0.12}
        textAlign="center"
        anchorY="top"
        color={PALETTE.ink}
      >
        {film.year === null ? film.title : `${film.title} (${film.year})`}
      </Text>
    </group>
  )
}

export function SuggestionBox() {
  return (
    <group
      position={[...FIXTURES.suggestion]}
      onPointerOver={blockPointer}
      onPointerMove={blockPointer}
      onClick={blockPointer}
    >
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.26, 0.3, 0.26]} />
        <meshLambertMaterial color={PALETTE.wood} />
      </mesh>
      <mesh position={[0, 0.302, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.16, 0.02]} />
        <meshBasicMaterial color={PALETTE.ink} />
      </mesh>
      <mesh position={[0, 0.2, 0.132]}>
        <boxGeometry args={[0.22, 0.07, 0.004]} />
        <meshLambertMaterial color={PALETTE.cream} />
      </mesh>
      <Text
        font={FONTS.display}
        position={[0, 0.2, 0.136]}
        fontSize={0.026}
        letterSpacing={0.1}
        color={PALETTE.rust}
      >
        SUGGESTIONS
      </Text>
      <mesh position={[0.24, 0.01, 0.02]}>
        <boxGeometry args={[0.1, 0.02, 0.07]} />
        <meshLambertMaterial color={PALETTE.cream} />
      </mesh>
      <mesh position={[0.24, 0.026, 0.07]} rotation={[0, 0.4, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.14, 6]} />
        <meshLambertMaterial color={PALETTE.gold} />
      </mesh>
    </group>
  )
}

const KEYPAD = Array.from({ length: 12 }, (_, i) => ({
  id: `key-${i}`,
  x: -0.04 + (i % 3) * 0.04,
  z: 0.02 + Math.floor(i / 3) * 0.018,
}))

function cordGeometry() {
  const points = Array.from({ length: 160 }, (_, i) => {
    const t = i / 159
    const base = new Vector3(
      -0.09 - Math.sin(t * Math.PI) * 0.08,
      0.035 - Math.sin(t * Math.PI) * 0.03,
      0.06 - t * 0.1,
    )
    const coil = t * Math.PI * 2 * 14
    return base.add(new Vector3(0, Math.sin(coil) * 0.008, Math.cos(coil) * 0.008))
  })
  return new TubeGeometry(new CatmullRomCurve3(points), 320, 0.0035, 6, false)
}

/** Two bursts, the way a phone rings: shake, pause, shake, then settle. */
export function ringShake(elapsed: number): { lift: number; tilt: number; sway: number } {
  const burst = elapsed < RING.burst || (elapsed > RING.gap && elapsed < RING.gap + RING.burst)
  const fade = Math.max(0, 1 - elapsed / RING.seconds)
  const wobble = burst ? Math.sin(elapsed * RING.rate) * fade : 0
  return {
    lift: Math.abs(wobble) * RING.lift,
    tilt: wobble * RING.tilt,
    sway: wobble * RING.sway,
  }
}

export function Telephone({ rings = 0 }: { rings?: number }) {
  const cord = useMemo(cordGeometry, [])
  const body = useRef<Group>(null)
  const handset = useRef<Group>(null)
  const started = useRef(-1)
  const clock = useRef(0)

  if (started.current !== rings) {
    started.current = rings
    clock.current = 0
  }

  useFrame((_, dt) => {
    const cradle = handset.current
    const whole = body.current
    if (!cradle || !whole || rings === 0) {
      return
    }
    clock.current = Math.min(clock.current + dt, RING.seconds)
    const { lift, tilt, sway } = ringShake(clock.current)
    cradle.position.y = HANDSET_Y + lift
    cradle.rotation.z = tilt
    whole.position.x = sway
  })

  return (
    <group position={[...FIXTURES.telephone]}>
      <group ref={body}>
        <mesh position={[0, 0.035, 0]}>
          <boxGeometry args={[0.18, 0.07, 0.22]} />
          <meshLambertMaterial color={PALETTE.rustBright} />
        </mesh>
        {KEYPAD.map((key) => (
          <mesh key={key.id} position={[key.x, 0.073, key.z]}>
            <boxGeometry args={[0.026, 0.006, 0.012]} />
            <meshLambertMaterial color={PALETTE.cream} />
          </mesh>
        ))}
        <group ref={handset} position={[0, HANDSET_Y, -0.05]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.02, 0.15, 4, 10]} />
            <meshLambertMaterial color={PALETTE.rustBright} />
          </mesh>
          {[-0.095, 0.095].map((x) => (
            <mesh key={x} position={[x, -0.012, 0]}>
              <sphereGeometry args={[0.032, 12, 10]} />
              <meshLambertMaterial color={PALETTE.rustBright} />
            </mesh>
          ))}
        </group>
        <mesh geometry={cord}>
          <meshLambertMaterial color={PALETTE.ink} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

export function EntryGate() {
  return (
    <group position={[GATE.x, 0, GATE.z]}>
      {[-GATE.halfWidth, GATE.halfWidth].map((x) => (
        <mesh key={x} position={[x, GATE.height / 2, 0]}>
          <cylinderGeometry args={[GATE.postRadius, GATE.postRadius, GATE.height, 16]} />
          <meshLambertMaterial color={PALETTE.ink} />
        </mesh>
      ))}
      <mesh position={[0, GATE.height + 0.1, 0]}>
        <boxGeometry args={[GATE.halfWidth * 2 + 0.3, 0.36, 0.06]} />
        <meshLambertMaterial color={PALETTE.rust} />
      </mesh>
      <Text
        font={FONTS.display}
        position={[0, GATE.height + 0.1, 0.032]}
        fontSize={0.13}
        letterSpacing={0.14}
        color={PALETTE.gold}
      >
        ENTER THE STORE
      </Text>
      <Text
        font={FONTS.display}
        position={[0, GATE.height + 0.1, -0.032]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.13}
        letterSpacing={0.14}
        color={PALETTE.gold}
      >
        BE KIND · REWIND
      </Text>
    </group>
  )
}
