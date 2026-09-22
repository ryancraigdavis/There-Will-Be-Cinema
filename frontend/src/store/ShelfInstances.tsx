import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
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
import { LIGHT_RIG } from '../theme/lightRig'
import { spineColor } from '../theme/palette'
import { cellOrigin, cellSize } from './batches'
import { createBoxMaterial } from './boxMaterial'
import { BOX } from './constants'
import type { Slot } from './geometry'
import type { RunBatch } from './tapeBatches'
import { bakeLight, coverNormal } from './tapeLight'
import { registerBatch } from './tapeRegistry'

const BASE = new BoxGeometry(BOX.spine, BOX.height, BOX.cover)
const UP = new Vector3(0, 1, 0)
const noRaycast = () => undefined
const position = new Vector3()
const rotation = new Quaternion()
const matrix = new Matrix4()
const ONE = new Vector3(1, 1, 1)

function batchGeometry(
  slots: readonly Slot[],
  catalog: Catalog,
  index: AtlasIndex | null,
  display: boolean,
) {
  const geometry = BASE.clone()
  const cells = new Float32Array(slots.length * 3)
  const spines = new Float32Array(slots.length * 3)
  const lights = new Float32Array(slots.length * 3)
  const color = new Color()
  slots.forEach((slot, i) => {
    const [r, g, b] = spineColor(catalog.byId.get(slot.itemId)?.primaryGenre ?? '', slot.itemId)
    color.setRGB(r, g, b, SRGBColorSpace)
    cells.set(cellOrigin(slot.itemId, index, display), i * 3)
    spines.set([color.r, color.g, color.b], i * 3)
    lights.set(bakeLight(slot.position, coverNormal(slot.yaw), LIGHT_RIG), i * 3)
  })
  geometry.setAttribute('aCell', new InstancedBufferAttribute(cells, 3))
  geometry.setAttribute('aSpine', new InstancedBufferAttribute(spines, 3))
  geometry.setAttribute('aLight', new InstancedBufferAttribute(lights, 3))
  return geometry
}

function slotMatrix(slot: Slot): Matrix4 {
  position.set(slot.position[0], slot.position[1], slot.position[2])
  rotation.setFromAxisAngle(UP, slot.yaw)
  return matrix.compose(position, rotation, ONE)
}

interface BatchProps {
  batch: RunBatch
  index: AtlasIndex | null
  catalog: Catalog
}

export function ShelfBoxes({ batch, index, catalog }: BatchProps) {
  const { key, slots, atlas, display, bounds } = batch
  const mesh = useRef<InstancedMesh>(null)
  const { material, uniforms } = useMemo(() => createBoxMaterial(cellSize(index)), [index])
  const geometry = useMemo(
    () => batchGeometry(slots, catalog, index, display),
    [slots, catalog, index, display],
  )
  perf.count('render.BoxBatch')

  useEffect(() => registerBatch({ key, atlas, bounds, uniforms }), [key, atlas, bounds, uniforms])

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
      target.setMatrixAt(i, slotMatrix(slot))
    })
    target.instanceMatrix.needsUpdate = true
    perf.count('matrix.rewrite', slots.length)
    target.computeBoundingBox()
    target.computeBoundingSphere()
  }, [slots])

  return (
    <instancedMesh
      ref={mesh}
      name="tapes"
      args={[geometry, material, slots.length]}
      raycast={noRaycast}
    />
  )
}
