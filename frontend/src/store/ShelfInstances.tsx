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
import { useScene } from '../shell/sceneState'
import { spineColor } from '../theme/palette'
import { useAtlasTexture } from './atlasTextures'
import { cellOrigin, cellSize, groupSlotsByAtlas } from './batches'
import { createBoxMaterial } from './boxMaterial'
import { BOX } from './constants'
import type { Section, Slot } from './layout'

const BASE = new BoxGeometry(BOX.spine, BOX.height, BOX.cover)
const PULL_OUT = 0.05
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
    const item = catalog.byId.get(slot.itemId)
    const [r, g, b] = spineColor(item?.primaryGenre ?? '', slot.itemId)
    color.setRGB(r, g, b, SRGBColorSpace)
    cells.set(cellOrigin(slot.itemId, index), i * 3)
    spines.set([color.r, color.g, color.b], i * 3)
  })
  geometry.setAttribute('aCell', new InstancedBufferAttribute(cells, 3))
  geometry.setAttribute('aSpine', new InstancedBufferAttribute(spines, 3))
  return geometry
}

function slotMatrix(slot: Slot, pull: number, scale: number, target: Matrix4): Matrix4 {
  const position = new Vector3(
    slot.position[0] + Math.sin(slot.yaw) * pull,
    slot.position[1],
    slot.position[2] + Math.cos(slot.yaw) * pull,
  )
  const rotation = new Quaternion().setFromAxisAngle(UP, slot.yaw)
  return target.compose(position, rotation, new Vector3(scale, scale, scale))
}

interface BatchProps {
  slots: Slot[]
  atlas: number
  index: AtlasIndex | null
  catalog: Catalog
}

function BoxBatch({ slots, atlas, index, catalog }: BatchProps) {
  const mesh = useRef<InstancedMesh>(null)
  const hovered = useRef(-1)
  const texture = useAtlasTexture(index, atlas)
  const selected = useScene((state) => state.selected)
  const { material, uniforms } = useMemo(() => createBoxMaterial(cellSize(index)), [index])
  const geometry = useMemo(() => batchGeometry(slots, catalog, index), [slots, catalog, index])

  useEffect(() => {
    uniforms.uAtlas.value = texture
    uniforms.uHasAtlas.value = texture ? 1 : 0
  }, [texture, uniforms])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  const write = (i: number) => {
    const slot = slots[i]
    const target = mesh.current
    if (!slot || !target) {
      return
    }
    const pull = i === hovered.current ? PULL_OUT : 0
    const scale = slot.itemId === useScene.getState().selected ? 0 : 1
    target.setMatrixAt(i, slotMatrix(slot, pull, scale, new Matrix4()))
    target.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => {
    const target = mesh.current
    if (!target) {
      return
    }
    slots.forEach((_, i) => {
      write(i)
    })
    target.computeBoundingBox()
    target.computeBoundingSphere()
  })

  const hoverIndex = (next: number) => {
    const previous = hovered.current
    hovered.current = next
    uniforms.uHover.value = next
    write(previous)
    write(next)
    const item = catalog.byId.get(slots[next]?.itemId ?? '')
    useScene.getState().setHover(item ? [item.title, item.year].filter(Boolean).join(' · ') : null)
  }

  const inStore = () =>
    useScene.getState().mode === 'free' &&
    !useScene.getState().paused &&
    !useScene.getState().selected

  const move = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const next = inStore() ? (event.instanceId ?? -1) : -1
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
    event.stopPropagation()
    const slot = slots[event.instanceId ?? -1]
    if (slot && inStore() && event.delta <= CLICK_SLOP_PX && !selected) {
      hoverIndex(-1)
      useScene.getState().select(slot.itemId)
    }
  }

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, slots.length]}
      onPointerMove={move}
      onPointerOut={out}
      onClick={click}
    />
  )
}

interface SectionProps {
  section: Section
  catalog: Catalog
  index: AtlasIndex | null
}

export function SectionBoxes({ section, catalog, index }: SectionProps) {
  const batches = useMemo(() => groupSlotsByAtlas(section.slots, index), [section.slots, index])
  return batches.map((batch) => (
    <BoxBatch
      key={`${section.id}:${batch.atlas}`}
      slots={batch.slots}
      atlas={batch.atlas}
      index={index}
      catalog={catalog}
    />
  ))
}
