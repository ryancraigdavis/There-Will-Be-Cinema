import { useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, type InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three'
import { PALETTE } from '../theme/palette'
import type { StorePlan } from './layout'
import { type BoxPart, shelvingParts } from './shelving'

const UNIT = new BoxGeometry(1, 1, 1)
const UP = new Vector3(0, 1, 0)

function PartMesh({ parts, color }: { parts: BoxPart[]; color: string }) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const target = mesh.current
    if (!target) {
      return
    }
    const matrix = new Matrix4()
    const rotation = new Quaternion()
    parts.forEach((part, i) => {
      rotation.setFromAxisAngle(UP, part.yaw)
      matrix.compose(new Vector3(...part.position), rotation, new Vector3(...part.size))
      target.setMatrixAt(i, matrix)
    })
    target.instanceMatrix.needsUpdate = true
    target.computeBoundingSphere()
  }, [parts])

  return (
    <instancedMesh key={parts.length} ref={mesh} args={[UNIT, undefined, parts.length]}>
      <meshLambertMaterial color={color} />
    </instancedMesh>
  )
}

export function Shelving({ plan }: { plan: StorePlan }) {
  const parts = useMemo(() => shelvingParts(plan.gondolas, plan.runs), [plan])
  return (
    <>
      <PartMesh parts={parts.boards} color="#d9c9a6" />
      <PartMesh parts={parts.trims} color={PALETTE.rustBright} />
      <PartMesh parts={parts.panels} color="#5a2114" />
      <PartMesh parts={parts.blocks} color={PALETTE.ink} />
    </>
  )
}
