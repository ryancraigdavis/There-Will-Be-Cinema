import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Color, type Group, type InstancedMesh, Matrix4 } from 'three'
import type { Vec3 } from '../scene/math'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import { GUMBALL, POPCORN } from './anchors'
import { type Glow, Hotspot } from './Hotspot'

const GUM_COLORS = ['#e23b2e', '#f2b705', '#2f9e44', '#1c7ed6', '#d6336c', '#f08c00']
const TURN_SECONDS = 1.6
const CHUTE = { top: 0.86, rest: 0.6, z: 0.21 }
const KERNELS = 48
const POP_SECONDS = 2.4
const GRAVITY = 3.4
const CASE = { x: 0.25, z: 0.19, floor: -0.17, top: 0.2 }

const hold = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value))
const landing = (vy: number) => (vy + Math.sqrt(vy * vy - 2 * GRAVITY * CASE.floor)) / GRAVITY

function rng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface ClusterProps {
  points: Vec3[]
  radius: number
  colors: readonly string[]
}

function Cluster({ points, radius, colors }: ClusterProps) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const target = mesh.current
    if (!target) {
      return
    }
    const matrix = new Matrix4()
    const color = new Color()
    points.forEach((point, i) => {
      target.setMatrixAt(i, matrix.makeTranslation(point[0], point[1], point[2]))
      target.setColorAt(i, color.set(colors[i % colors.length] ?? '#ffffff'))
    })
    target.instanceMatrix.needsUpdate = true
    if (target.instanceColor) {
      target.instanceColor.needsUpdate = true
    }
    target.computeBoundingSphere()
  }, [points, colors])

  return (
    <instancedMesh key={points.length} ref={mesh} args={[undefined, undefined, points.length]}>
      <sphereGeometry args={[radius, 8, 6]} />
      <meshLambertMaterial />
    </instancedMesh>
  )
}

function scatter(count: number, seed: number, spread: Vec3, base: Vec3): Vec3[] {
  const random = rng(seed)
  return Array.from({ length: count }, () => [
    base[0] + (random() - 0.5) * spread[0],
    base[1] + (random() - 0.5) * spread[1],
    base[2] + (random() - 0.5) * spread[2],
  ])
}

function heap(count: number, seed: number, spread: Vec3, base: Vec3): Vec3[] {
  const random = rng(seed)
  return Array.from({ length: count }, () => {
    const x = (random() - 0.5) * spread[0]
    const z = (random() - 0.5) * spread[2]
    const rise = 1 - Math.max(Math.abs(x) / spread[0], Math.abs(z) / spread[2]) * 1.7
    return [base[0] + x, base[1] + random() * spread[1] * Math.max(0.12, rise), base[2] + z] as Vec3
  })
}

function Popping({ run }: { run: number }) {
  const mesh = useRef<InstancedMesh>(null)
  const clock = useRef(POP_SECONDS)
  const lastRun = useRef(run)
  if (lastRun.current !== run) {
    lastRun.current = run
    clock.current = 0
  }
  const kernels = useMemo(() => {
    const random = rng(7)
    return Array.from({ length: KERNELS }, () => {
      const vy = 1 + random() * 0.35
      return {
        vx: (random() - 0.5) * 0.5,
        vy,
        vz: (random() - 0.5) * 0.4,
        land: landing(vy),
      }
    })
  }, [])

  useFrame((_, delta) => {
    const target = mesh.current
    if (!target || clock.current >= POP_SECONDS) {
      return
    }
    clock.current += delta
    const matrix = new Matrix4()
    kernels.forEach((kernel, i) => {
      const t = Math.min(kernel.land, Math.max(0, clock.current - i * 0.02))
      const y = Math.min(CASE.top, kernel.vy * t - (GRAVITY * t * t) / 2)
      matrix.makeTranslation(hold(kernel.vx * t, CASE.x), y, hold(kernel.vz * t, CASE.z))
      target.setMatrixAt(i, matrix)
    })
    target.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, KERNELS]} position={[0, 0.26, 0]}>
      <sphereGeometry args={[0.014, 6, 5]} />
      <meshLambertMaterial color="#fff3d0" />
    </instancedMesh>
  )
}

const DECK = 1.02
const CART = { width: 0.68, depth: 0.52 } as const
const WHEELS: [number, number][] = [
  [-0.28, 0.18],
  [0.28, 0.18],
  [-0.28, -0.18],
  [0.28, -0.18],
]
const LEGS: [number, number][] = [
  [-0.27, 0.19],
  [0.27, 0.19],
  [-0.27, -0.19],
  [0.27, -0.19],
]

function Cart() {
  return (
    <>
      {WHEELS.map(([x, z]) => (
        <mesh key={`w${x}:${z}`} position={[x, 0.075, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.075, 0.04, 14]} />
          <meshLambertMaterial color={PALETTE.ink} />
        </mesh>
      ))}
      {LEGS.map(([x, z]) => (
        <mesh key={`l${x}:${z}`} position={[x, DECK / 2 + 0.06, z]}>
          <boxGeometry args={[0.05, DECK - 0.12, 0.05]} />
          <meshLambertMaterial color={PALETTE.rustBright} />
        </mesh>
      ))}
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[0.58, 0.04, 0.42]} />
        <meshLambertMaterial color={PALETTE.rust} />
      </mesh>
      <mesh position={[0, DECK - 0.03, 0]}>
        <boxGeometry args={[CART.width, 0.06, CART.depth]} />
        <meshLambertMaterial color={PALETTE.rustBright} />
      </mesh>
      <mesh position={[0, DECK - 0.075, 0]}>
        <boxGeometry args={[CART.width + 0.02, 0.03, CART.depth + 0.02]} />
        <meshLambertMaterial color={PALETTE.gold} />
      </mesh>
    </>
  )
}

function CaseFrame() {
  const posts: Vec3[] = [
    [-0.29, 0.26, 0.23],
    [0.29, 0.26, 0.23],
    [-0.29, 0.26, -0.23],
    [0.29, 0.26, -0.23],
  ]
  return (
    <>
      {posts.map((post) => (
        <mesh key={post.join()} position={[...post]}>
          <boxGeometry args={[0.03, 0.52, 0.03]} />
          <meshLambertMaterial color={PALETTE.gold} />
        </mesh>
      ))}
      {[0, 0.52].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[0.62, 0.035, 0.5]} />
          <meshLambertMaterial color={PALETTE.gold} />
        </mesh>
      ))}
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[0.58, 0.5, 0.46]} />
        <meshBasicMaterial color="#cfe6ef" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </>
  )
}

export function PopcornMachine({ onPop, pops }: { onPop: () => void; pops: number }) {
  const pile = useMemo(() => heap(120, 3, [0.52, 0.17, 0.4], [0, 0.04, 0]), [])
  return (
    <group position={[POPCORN.x, 0, POPCORN.z]} rotation={[0, POPCORN.yaw, 0]} onClick={onPop}>
      <Cart />
      <group position={[0, DECK, 0]}>
        <CaseFrame />
        <Cluster points={pile} radius={0.018} colors={['#fff3d0', '#f7e6b8']} />
        <mesh position={[0, 0.44, 0]}>
          <boxGeometry args={[0.24, 0.1, 0.2]} />
          <meshLambertMaterial color={PALETTE.steel} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.3, 0.012, 0.24]} />
          <meshBasicMaterial color="#ffdf9a" />
        </mesh>
        <Popping run={pops} />
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[0.66, 0.24, 0.05]} />
          <meshLambertMaterial color={PALETTE.rust} />
        </mesh>
        <Text
          font={FONTS.display}
          position={[0, 0.72, 0.03]}
          fontSize={0.1}
          letterSpacing={0.14}
          color={PALETTE.gold}
        >
          POPCORN
        </Text>
      </group>
    </group>
  )
}

export function GumballMachine({ onTurn, turns }: { onTurn: () => void; turns: number }) {
  const balls = useMemo(() => scatter(64, 11, [0.26, 0.26, 0.26], [0, 1.06, 0]), [])
  const crank = useRef<Group>(null)
  const dropped = useRef<Group>(null)
  const clock = useRef(TURN_SECONDS)
  const lastTurn = useRef(turns)
  if (lastTurn.current !== turns) {
    lastTurn.current = turns
    clock.current = 0
  }

  useFrame((_, delta) => {
    if (clock.current >= TURN_SECONDS) {
      return
    }
    clock.current += delta
    const t = Math.min(1, clock.current)
    crank.current?.rotation.set(0, 0, -t * Math.PI * 2)
    const fall = Math.min(1, Math.max(0, (clock.current - 0.3) / 0.55))
    dropped.current?.position.set(0, CHUTE.top - fall * (CHUTE.top - CHUTE.rest), CHUTE.z)
    dropped.current?.scale.setScalar(clock.current < 0.3 ? 0 : 1)
  })

  return (
    <group position={[GUMBALL.x, 0, GUMBALL.z]} rotation={[0, GUMBALL.yaw, 0]} onClick={onTurn}>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.11, 0.15, 0.72, 16]} />
        <meshLambertMaterial color={PALETTE.ink} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.16, 20]} />
        <meshLambertMaterial color={PALETTE.rustBright} />
      </mesh>
      <group ref={crank} position={[0, 0.8, 0.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
          <meshLambertMaterial color={PALETTE.gold} />
        </mesh>
        <mesh position={[0.075, 0, 0.04]}>
          <boxGeometry args={[0.13, 0.026, 0.026]} />
          <meshLambertMaterial color={PALETTE.gold} />
        </mesh>
      </group>
      <mesh position={[0, 0.66, 0.14]}>
        <boxGeometry args={[0.14, 0.1, 0.1]} />
        <meshLambertMaterial color={PALETTE.ink} />
      </mesh>
      <mesh position={[0, 0.56, CHUTE.z]}>
        <boxGeometry args={[0.17, 0.02, 0.1]} />
        <meshLambertMaterial color={PALETTE.gold} />
      </mesh>
      <mesh position={[0, 1.06, 0]}>
        <sphereGeometry args={[0.21, 20, 16]} />
        <meshBasicMaterial color="#cfe6ef" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <Cluster points={balls} radius={0.026} colors={GUM_COLORS} />
      <group ref={dropped} scale={0} position={[0, CHUTE.top, CHUTE.z]}>
        <mesh>
          <sphereGeometry args={[0.028, 10, 8]} />
          <meshLambertMaterial color={GUM_COLORS[turns % GUM_COLORS.length]} />
        </mesh>
      </group>
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.08, 12]} />
        <meshLambertMaterial color={PALETTE.gold} />
      </mesh>
    </group>
  )
}

const POPCORN_GLOW: Glow = {
  center: [POPCORN.x, 0.95, POPCORN.z],
  size: [0.8, 1.9, 0.7],
  yaw: POPCORN.yaw,
}
const GUMBALL_GLOW: Glow = {
  center: [GUMBALL.x, 0.75, GUMBALL.z],
  size: [0.5, 1.5, 0.5],
  yaw: GUMBALL.yaw,
}

export function Machines({ active }: { active: boolean }) {
  const [pops, setPops] = useState(0)
  const [turns, setTurns] = useState(0)
  return (
    <>
      <Hotspot
        label="Popcorn machine"
        glow={POPCORN_GLOW}
        active={active}
        onSelect={() => setPops((n) => n + 1)}
      >
        <PopcornMachine pops={pops} onPop={() => undefined} />
      </Hotspot>
      <Hotspot
        label="Gumball machine"
        glow={GUMBALL_GLOW}
        active={active}
        onSelect={() => setTurns((n) => n + 1)}
      >
        <GumballMachine turns={turns} onTurn={() => undefined} />
      </Hotspot>
    </>
  )
}
