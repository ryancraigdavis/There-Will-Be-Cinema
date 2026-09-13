import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { CatmullRomCurve3, DoubleSide, TubeGeometry, Vector3 } from 'three'
import { useTexture } from '../store/atlasTextures'
import { ROOM } from '../store/constants'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import { corkTexture, crtTexture, noteTexture } from '../theme/textures'
import { BULLETIN, COUNTER, FIXTURES, GATE } from './anchors'

export function Counter() {
  const { minX, maxX, minZ, maxZ, height } = COUNTER
  const width = maxX - minX
  const depth = maxZ - minZ
  return (
    <group position={[(minX + maxX) / 2, 0, (minZ + maxZ) / 2]}>
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
  { lines: ['NEXT SCREENING', 'Date TBA', 'See the club site'], x: -0.36, y: 0.04, tilt: 0.05 },
  {
    lines: ['SUGGESTIONS', 'Drop yours in the', 'box on the counter'],
    x: 0.02,
    y: -0.1,
    tilt: -0.04,
  },
  { lines: ['RSVP', 'Call the line or', 'use the club site'], x: 0.38, y: 0.08, tilt: 0.07 },
]

export function BulletinBoard() {
  const cork = useMemo(() => corkTexture(), [])
  const notes = useMemo(() => NOTES.map((note, i) => noteTexture(note.lines, i + 11)), [])
  return (
    <group position={[...FIXTURES.bulletin]} rotation={[0, BULLETIN.yaw, 0]}>
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
        MOVIE CLUB
      </Text>
      {NOTES.map((note, i) => (
        <group key={note.lines[0]} position={[note.x, note.y, 0.03]} rotation={[0, 0, note.tilt]}>
          <mesh>
            <planeGeometry args={[0.3, 0.3]} />
            <meshLambertMaterial map={notes[i]} />
          </mesh>
          <mesh position={[0, 0.13, 0.01]}>
            <sphereGeometry args={[0.012, 10, 8]} />
            <meshLambertMaterial color={i % 2 ? PALETTE.gold : PALETTE.rustBright} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function SuggestionBox() {
  return (
    <group position={[...FIXTURES.suggestion]}>
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

export function Telephone() {
  const cord = useMemo(cordGeometry, [])
  return (
    <group position={[...FIXTURES.telephone]}>
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
      <group position={[0, 0.1, -0.05]}>
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
