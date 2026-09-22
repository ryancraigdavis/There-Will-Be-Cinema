import type { Texture } from 'three'
import type { AABB } from '../player/collision'

export interface TapeUniforms {
  uAtlas: { value: Texture | null }
  uHasAtlas: { value: number }
  uHover: { value: number }
  uHidden: { value: number }
}

export interface TapeBatch {
  key: string
  atlas: number
  bounds: AABB
  uniforms: TapeUniforms
}

const batches = new Map<string, TapeBatch>()

export function registerBatch(batch: TapeBatch): () => void {
  batches.set(batch.key, batch)
  return () => batches.delete(batch.key)
}

export function tapeBatches(): ReadonlyMap<string, TapeBatch> {
  return batches
}

export function bindAtlas(batch: TapeBatch, texture: Texture | null): boolean {
  const changed = batch.uniforms.uAtlas.value !== texture
  batch.uniforms.uAtlas.value = texture
  batch.uniforms.uHasAtlas.value = texture ? 1 : 0
  return changed
}

export function setUniform(key: string, name: 'uHover' | 'uHidden', value: number): void {
  const batch = batches.get(key)
  if (batch) {
    batch.uniforms[name].value = value
  }
}
