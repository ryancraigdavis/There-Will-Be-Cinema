import { Canvas, events as pointerEvents, type RootState, useFrame } from '@react-three/fiber'
import { type ReactNode, useRef } from 'react'
import { ANCHORS } from '../lobby/anchors'
import { useScene } from './sceneState'

declare global {
  interface Window {
    __sceneReady?: boolean
    __rendererInfo?: string
    __renderStats?: Record<string, number>
  }
}

type EventStore = Parameters<typeof pointerEvents>[0]

const COARSE = window.matchMedia?.('(pointer: coarse)').matches ?? false
const MAX_DPR = COARSE ? 1.5 : 1.75

function lockAwareEvents(store: EventStore) {
  return {
    ...pointerEvents(store),
    compute: (event: Event, state: RootState) => {
      const locked = document.pointerLockElement === state.gl.domElement
      const pointer = event as PointerEvent
      const x = (pointer.offsetX / state.size.width) * 2 - 1
      const y = -(pointer.offsetY / state.size.height) * 2 + 1
      state.pointer.set(locked ? 0 : x, locked ? 0 : y)
      state.raycaster.setFromCamera(state.pointer, state.camera)
    },
  }
}

function ReadySignal() {
  const frames = useRef(0)
  useFrame(({ gl }) => {
    frames.current += 1
    if (frames.current !== 3) {
      return
    }
    const context = gl.getContext()
    const debug = context.getExtension('WEBGL_debug_renderer_info')
    window.__rendererInfo = debug
      ? String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL))
      : 'unknown renderer'
    window.__sceneReady = true
  })
  return null
}

function StatsSignal() {
  const frames = useRef(0)
  useFrame(({ gl }) => {
    frames.current = (frames.current + 1) % 30
    if (frames.current === 0) {
      window.__renderStats = {
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        textures: gl.info.memory.textures,
        geometries: gl.info.memory.geometries,
      }
    }
  })
  return null
}

export function SceneShell({ active, children }: { active: boolean; children: ReactNode }) {
  const setCanvas = useScene((state) => state.setCanvas)
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, MAX_DPR]}
      flat
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 70, near: 0.05, far: 60, position: [...ANCHORS.counter.position] }}
      events={lockAwareEvents}
      onCreated={({ gl }) => setCanvas(gl.domElement)}
    >
      <color attach="background" args={['#0c0504']} />
      <fog attach="fog" args={['#120705', 16, 40]} />
      {children}
      <ReadySignal />
      <StatsSignal />
    </Canvas>
  )
}
