import { type PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { setStick } from '../player/touchStick'
import { useScene } from '../shell/sceneState'

const RADIUS_PX = 56

interface Origin {
  x: number
  y: number
  id: number
}

export function TouchControls() {
  const mode = useScene((state) => state.mode)
  const paused = useScene((state) => state.paused)
  const coarse = useMemo(() => window.matchMedia?.('(pointer: coarse)').matches ?? false, [])
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const origin = useRef<Origin | null>(null)

  useEffect(() => () => setStick(0, 0), [])

  const update = (event: PointerEvent<HTMLDivElement>) => {
    const start = origin.current
    if (!start || event.pointerId !== start.id) {
      return
    }
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const scale = Math.min(1, RADIUS_PX / Math.max(Math.hypot(dx, dy), 1e-6))
    setKnob({ x: dx * scale, y: dy * scale })
    setStick((dx * scale) / RADIUS_PX, (dy * scale) / RADIUS_PX)
  }

  const down = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    const rect = event.currentTarget.getBoundingClientRect()
    origin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      id: event.pointerId,
    }
    update(event)
  }

  const up = () => {
    origin.current = null
    setKnob({ x: 0, y: 0 })
    setStick(0, 0)
  }

  return coarse && mode === 'free' && !paused ? (
    <div
      className="stick"
      aria-hidden="true"
      onPointerDown={down}
      onPointerMove={update}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <div className="stick__knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  ) : null
}
