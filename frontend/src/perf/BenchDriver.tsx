import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Camera } from 'three'
import { useScene } from '../shell/sceneState'
import { useWarmup, warmedUp } from '../shell/warmup'
import type { Slot } from '../store/geometry'
import type { StorePlan } from '../store/layout'
import { type BenchAction, keyChanges, nearestItem, ROUTE, segmentIndexAt } from './benchRoute'
import { perf } from './perf'

interface Context {
  canvas: HTMLCanvasElement
  camera: Camera
  slots: readonly Slot[]
}

function nudgePointer(canvas: HTMLCanvasElement) {
  const box = canvas.getBoundingClientRect()
  canvas.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      pointerId: 1,
      clientX: box.left + box.width / 2,
      clientY: box.top + box.height / 2,
    }),
  )
}

const ACTIONS: Record<BenchAction, (context: Context) => void> = {
  enter: ({ canvas }) => {
    useScene.getState().dispatch('enter')
    nudgePointer(canvas)
  },
  walk: () => useScene.getState().dispatch('walk'),
  select: ({ camera, slots }) =>
    useScene.getState().select(nearestItem(slots, camera.position.x, camera.position.z)),
}

function sendKeys(type: 'keydown' | 'keyup', codes: readonly string[]) {
  for (const code of codes) {
    window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }))
  }
}

function finish() {
  if (window.__perf) {
    window.__perf.benchDone = true
  }
}

export function BenchDriver({ plan }: { plan: StorePlan | null }) {
  const canvas = useThree((state) => state.gl.domElement)
  const camera = useThree((state) => state.camera)
  const slots = useMemo(() => (plan?.sections ?? []).flatMap((section) => section.slots), [plan])
  const frame = useRef(-1)
  const segment = useRef(-2)
  const held = useRef<readonly string[]>([])

  const enterSegment = (index: number) => {
    const spec = ROUTE[index]
    const keys = spec?.keys ?? []
    const { up, down } = keyChanges(held.current, keys)
    const act = spec?.action && ACTIONS[spec.action]
    segment.current = index
    held.current = keys
    sendKeys('keyup', up)
    perf.mark(spec?.label ?? 'done')
    act?.({ canvas, camera, slots })
    sendKeys('keydown', down)
    if (!spec) {
      finish()
    }
  }

  useFrame(() => {
    const waiting = frame.current < 0 && !(slots.length > 0 && warmedUp(useWarmup.getState()))
    if (waiting) {
      return
    }
    frame.current += 1
    const index = segmentIndexAt(ROUTE, frame.current)
    if (index !== segment.current) {
      enterSegment(index)
    }
  })

  return null
}
