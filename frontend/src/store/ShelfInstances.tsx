import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  InstancedBufferAttribute,
  type InstancedMesh,
  Matrix4,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from 'three'
import type { AtlasIndex, Catalog } from '../catalog/types'
import { perf } from '../perf/perf'
import type { Vec3 } from '../scene/math'
import { useScene } from '../shell/sceneState'
import { spineColor } from '../theme/palette'
import { cellOrigin, cellSize, groupSlotsByAtlas } from './batches'
import { createBoxMaterial } from './boxMaterial'
import { BOX } from './constants'
import type { Slot } from './geometry'
import { registerBatch } from './tapeRegistry'

export interface ShelfGroup {
  id: string
  slots: Slot[]
  center: Vec3
}

const BASE = new BoxGeometry(BOX.spine, BOX.height, BOX.cover)
const CLICK_SLOP_PX = 4
const UP = new Vector3(0, 1, 0)

function batchGeometry(slots: readonly Slot[], catalog: Catalog, index: AtlasIndex | null) {
  const geometry = new BufferGeometry()
  geometry.setIndex(BASE.index)
  for (const name of ['position', 'normal', 'uv']) {
    geometry.setAttribute(name, BASE.getAttribute(name))
  }
  const cells = new Float32Array(slots.length * 3)
  const spines = new Float32Array(slots.length * 3)
  const color = new Color()
  slots.forEach((slot, i) => {
    const [r, g, b] = spineColor(catalog.byId.get(slot.itemId)?.primaryGenre ?? '', slot.itemId)
    color.setRGB(r, g, b, SRGBColorSpace)
    cells.set(cellOrigin(slot.itemId, index), i * 3)
    spines.set([color.r, color.g, color.b], i * 3)
  })
  geometry.setAttribute('aCell', new InstancedBufferAttribute(cells, 3))
  geometry.setAttribute('aSpine', new InstancedBufferAttribute(spines, 3))
  return geometry
}

function slotMatrix(slot: Slot, scale: number): Matrix4 {
  const position = new Vector3(slot.position[0], slot.position[1], slot.position[2])
  const rotation = new Quaternion().setFromAxisAngle(UP, slot.yaw)
  return new Matrix4().compose(position, rotation, new Vector3(scale, scale, scale))
}

function browsing(): boolean {
  const scene = useScene.getState()
  return scene.mode === 'free' && !scene.paused && !scene.selected
}

function hoverLabel(catalog: Catalog, itemId: string | undefined): string | null {
  const item = catalog.byId.get(itemId ?? '')
  return item ? [item.title, item.year].filter(Boolean).join(' · ') : null
}

interface BatchProps {
  slots: Slot[]
  atlas: number
  index: AtlasIndex | null
  catalog: Catalog
  center: Vec3
}

function BoxBatch({ slots, atlas, index, catalog, center }: BatchProps) {
  const mesh = useRef<InstancedMesh>(null)
  const hovered = useRef(-1)
  const selected = useScene((state) => state.selected)
  const { material, uniforms } = useMemo(() => createBoxMaterial(cellSize(index)), [index])
  const geometry = useMemo(() => batchGeometry(slots, catalog, index), [slots, catalog, index])
  perf.count('render.BoxBatch')

  useEffect(
    () => registerBatch({ atlas, center, uniforms, mesh: mesh.current }),
    [atlas, center, uniforms],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useLayoutEffect(() => {
    const target = mesh.current
    if (!target) {
      return
    }
    slots.forEach((slot, i) => {
      target.setMatrixAt(i, slotMatrix(slot, slot.itemId === selected ? 0 : 1))
    })
    target.instanceMatrix.needsUpdate = true
    perf.count('matrix.rewrite', slots.length)
    target.computeBoundingBox()
    target.computeBoundingSphere()
  }, [slots, selected])

  const hoverIndex = (next: number) => {
    hovered.current = next
    uniforms.uHover.value = next
    useScene.getState().setHover(hoverLabel(catalog, slots[next]?.itemId))
  }

  const move = (event: ThreeEvent<PointerEvent>) => {
    if (!browsing()) {
      return
    }
    event.stopPropagation()
    const next = event.instanceId ?? -1
    if (next !== hovered.current) {
      hoverIndex(next)
    }
  }

  const out = () => {
    if (hovered.current !== -1) {
      hoverIndex(-1)
    }
  }

  const click = (event: ThreeEvent<MouseEvent>) => {
    const slot = slots[event.instanceId ?? -1]
    if (!slot || !browsing() || event.delta > CLICK_SLOP_PX) {
      return
    }
    event.stopPropagation()
    hoverIndex(-1)
    useScene.getState().select(slot.itemId)
  }

  return (
    <instancedMesh
      ref={mesh}
      name="tapes"
      args={[geometry, material, slots.length]}
      onPointerMove={move}
      onPointerOut={out}
      onClick={click}
    />
  )
}

interface ShelfBoxesProps {
  group: ShelfGroup
  catalog: Catalog
  index: AtlasIndex | null
}

export function ShelfBoxes({ group, catalog, index }: ShelfBoxesProps) {
  const batches = useMemo(() => groupSlotsByAtlas(group.slots, index), [group.slots, index])
  return batches.map((batch) => (
    <BoxBatch
      key={`${group.id}:${batch.atlas}`}
      slots={batch.slots}
      atlas={batch.atlas}
      index={index}
      catalog={catalog}
      center={group.center}
    />
  ))
}
