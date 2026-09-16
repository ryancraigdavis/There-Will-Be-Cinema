import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  InstancedBufferAttribute,
  type InstancedMesh,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three'
import { letterTexture } from '../theme/textures'
import { createDividerMaterial } from './dividerMaterial'
import { DIVIDER, type Divider } from './dividers'
import { LETTER_GRID, letterCell } from './letters'

const BASE = new PlaneGeometry(DIVIDER.width, DIVIDER.height)
const UP = new Vector3(0, 1, 0)
const CELL: [number, number] = [1 / LETTER_GRID.cols, 1 / LETTER_GRID.rows]

function tabGeometry(dividers: readonly Divider[]) {
  const geometry = BASE.clone()
  const cells = new Float32Array(dividers.length * 2)
  dividers.forEach((divider, i) => {
    const [col, row] = letterCell(divider.letter)
    cells.set([col * CELL[0], 1 - (row + 1) * CELL[1]], i * 2)
  })
  geometry.setAttribute('aCell', new InstancedBufferAttribute(cells, 2))
  return geometry
}

export function Dividers({ dividers }: { dividers: Divider[] }) {
  const mesh = useRef<InstancedMesh>(null)
  const letters = useMemo(() => letterTexture(), [])
  const { material } = useMemo(() => createDividerMaterial(letters, CELL), [letters])
  const geometry = useMemo(() => tabGeometry(dividers), [dividers])

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
    const matrix = new Matrix4()
    const rotation = new Quaternion()
    dividers.forEach((divider, i) => {
      rotation.setFromAxisAngle(UP, divider.yaw)
      matrix.compose(new Vector3(...divider.position), rotation, new Vector3(1, 1, 1))
      target.setMatrixAt(i, matrix)
    })
    target.instanceMatrix.needsUpdate = true
    target.computeBoundingSphere()
  }, [dividers])

  return dividers.length > 0 ? (
    <instancedMesh
      key={dividers.length}
      ref={mesh}
      name="letter-tabs"
      args={[geometry, material, dividers.length]}
    />
  ) : null
}
