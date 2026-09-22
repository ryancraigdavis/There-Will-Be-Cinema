import type { ReactNode } from 'react'
import { useLayoutEffect, useRef } from 'react'
import { Color, type InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three'
import type { Vec3 } from '../scene/math'

export interface Transform {
  position: Vec3
  scale?: Vec3
  yaw?: number
  quaternion?: [number, number, number, number]
  color?: string
}

const position = new Vector3()
const rotation = new Quaternion()
const scale = new Vector3()
const matrix = new Matrix4()
const tint = new Color()

function place(mesh: InstancedMesh, transforms: readonly Transform[]) {
  transforms.forEach((transform, i) => {
    position.set(...transform.position)
    scale.set(...(transform.scale ?? [1, 1, 1]))
    const [qx, qy, qz, qw] = transform.quaternion ?? [
      0,
      Math.sin((transform.yaw ?? 0) / 2),
      0,
      Math.cos((transform.yaw ?? 0) / 2),
    ]
    rotation.set(qx, qy, qz, qw)
    mesh.setMatrixAt(i, matrix.compose(position, rotation, scale))
    if (transform.color) {
      mesh.setColorAt(i, tint.set(transform.color))
    }
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true
  }
  mesh.computeBoundingSphere()
}

interface Props {
  transforms: readonly Transform[]
  name?: string
  children: ReactNode
}

export function Instanced({ transforms, name, children }: Props) {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    if (mesh.current) {
      place(mesh.current, transforms)
    }
  }, [transforms])
  return (
    <instancedMesh
      key={transforms.length}
      ref={mesh}
      name={name}
      args={[undefined, undefined, transforms.length]}
    >
      {children}
    </instancedMesh>
  )
}
