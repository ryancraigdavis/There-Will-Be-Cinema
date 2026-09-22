import type { InstancedMesh, Texture } from 'three'
import type { Vec3 } from '../scene/math'

export interface TapeUniforms {
  uAtlas: { value: Texture | null }
  uHasAtlas: { value: number }
}

export interface TapeBatch {
  atlas: number
  center: Vec3
  uniforms: TapeUniforms
  mesh: InstancedMesh | null
}

const batches = new Set<TapeBatch>()

export function registerBatch(batch: TapeBatch): () => void {
  batches.add(batch)
  return () => batches.delete(batch)
}

export function tapeBatches(): ReadonlySet<TapeBatch> {
  return batches
}

export function bindAtlas(batch: TapeBatch, texture: Texture | null): boolean {
  const changed = batch.uniforms.uAtlas.value !== texture
  batch.uniforms.uAtlas.value = texture
  batch.uniforms.uHasAtlas.value = texture ? 1 : 0
  return changed
}
