import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { Intersection, Object3D, Raycaster } from 'three'
import { Vector3 } from 'three'
import type { AtlasIndex, Catalog } from '../catalog/types'
import { perf } from '../perf/perf'
import { useScene } from '../shell/sceneState'
import { PICK_DISTANCE } from './lod'
import { buildPickIndex, type PickSection, type PickSlot, pickTape, tapeLocations } from './pick'
import { setUniform } from './tapeRegistry'

const CLICK_SLOP_PX = 4

interface TapeHit extends Intersection {
  slot: PickSlot
}

interface Section {
  id: string
  slots: readonly { itemId: string; position: readonly [number, number, number]; yaw: number }[]
}

function browsing(): boolean {
  const scene = useScene.getState()
  return scene.mode === 'free' && !scene.paused && !scene.selected
}

function hoverLabel(catalog: Catalog, itemId: string | undefined): string | null {
  const item = catalog.byId.get(itemId ?? '')
  return item ? [item.title, item.year].filter(Boolean).join(' · ') : null
}

function raycastTapes(sections: readonly PickSection[]) {
  return function raycast(this: Object3D, raycaster: Raycaster, intersects: Intersection[]) {
    const { origin, direction } = raycaster.ray
    const hidden = useScene.getState().selected
    perf.count('pick.passes')
    const hit = pickTape(
      [origin.x, origin.y, origin.z],
      [direction.x, direction.y, direction.z],
      PICK_DISTANCE,
      sections,
      hidden,
    )
    if (hit) {
      const point = new Vector3().copy(direction).multiplyScalar(hit.distance).add(origin)
      const tape: TapeHit = { distance: hit.distance, point, object: this, slot: hit.slot }
      intersects.push(tape)
    }
  }
}

function useHiddenTape(locations: Map<string, { key: string; instance: number }[]>) {
  useEffect(() => {
    let shown: { key: string; instance: number }[] = []
    const apply = (selected: string | null) => {
      for (const { key } of shown) {
        setUniform(key, 'uHidden', -1)
      }
      shown = locations.get(selected ?? '') ?? []
      for (const { key, instance } of shown) {
        setUniform(key, 'uHidden', instance)
      }
    }
    apply(useScene.getState().selected)
    const unsubscribe = useScene.subscribe((state) => apply(state.selected))
    return () => {
      unsubscribe()
      apply(null)
    }
  }, [locations])
}

interface Props {
  sections: readonly Section[]
  index: AtlasIndex | null
  catalog: Catalog
}

export function TapePicker({ sections, index, catalog }: Props) {
  const pickIndex = useMemo(() => buildPickIndex(sections, index), [sections, index])
  const locations = useMemo(() => tapeLocations(pickIndex), [pickIndex])
  const raycast = useMemo(() => raycastTapes(pickIndex), [pickIndex])
  const hovered = useRef<PickSlot | null>(null)
  useHiddenTape(locations)

  const hover = (next: PickSlot | null) => {
    const previous = hovered.current
    if (previous) {
      setUniform(previous.key, 'uHover', -1)
    }
    if (next) {
      setUniform(next.key, 'uHover', next.instance)
    }
    hovered.current = next
    useScene.getState().setHover(hoverLabel(catalog, next?.itemId))
  }

  const move = (event: ThreeEvent<PointerEvent>) => {
    if (!browsing()) {
      return
    }
    event.stopPropagation()
    const slot = (event as unknown as TapeHit).slot
    if (slot !== hovered.current) {
      hover(slot)
    }
  }

  const out = () => {
    if (hovered.current) {
      hover(null)
    }
  }

  const click = (event: ThreeEvent<MouseEvent>) => {
    const slot = (event as unknown as TapeHit).slot
    if (!browsing() || event.delta > CLICK_SLOP_PX) {
      return
    }
    event.stopPropagation()
    hover(null)
    useScene.getState().select(slot.itemId)
  }

  return (
    <object3D
      name="tape-pick"
      raycast={raycast}
      onPointerMove={move}
      onPointerOut={out}
      onClick={click}
    />
  )
}
