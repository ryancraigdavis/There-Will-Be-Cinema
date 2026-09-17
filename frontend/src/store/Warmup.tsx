import { useFrame, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { atlasUrl } from '../api'
import type { AtlasIndex } from '../catalog/types'
import { useWarmup, warmLevel } from '../shell/warmup'
import { acquireTexture, releaseTexture } from './atlasTextures'
import { availableLevels } from './lod'
import { uploadStep } from './textureUploads'

export function TextureUploads() {
  useFrame(({ gl }) => {
    uploadStep(gl)
  })
  return null
}

export function WarmAtlases({ index, maxSize }: { index: AtlasIndex | null; maxSize: number }) {
  useEffect(() => {
    const level = index ? warmLevel(availableLevels(index), maxSize) : null
    const urls =
      index && level ? Array.from({ length: index.count }, (_, i) => atlasUrl(index, i, level)) : []
    Promise.all(urls.map(acquireTexture)).then(
      () => useWarmup.getState().mark({ atlases: index !== null }),
      () => useWarmup.getState().mark({ atlases: true }),
    )
    return () => urls.forEach(releaseTexture)
  }, [index, maxSize])
  return null
}

export function ShaderWarmup({ ready }: { ready: boolean }) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  useEffect(() => {
    const frame = ready
      ? requestAnimationFrame(() => {
          gl.compileAsync(scene, camera)
            .catch(() => undefined)
            .finally(() => useWarmup.getState().mark({ shaders: true }))
        })
      : 0
    return () => cancelAnimationFrame(frame)
  }, [ready, gl, scene, camera])
  return null
}
