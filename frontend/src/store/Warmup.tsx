import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { atlasUrl } from '../api'
import type { AtlasIndex } from '../catalog/types'
import { useWarmup, warmLevel } from '../shell/warmup'
import { acquireTexture, releaseTexture } from './atlasTextures'
import { availableLevels, MOVED_METRES } from './lod'
import { uploadStep } from './textureUploads'

export function TextureUploads() {
  const last = useRef(new Vector3(Number.POSITIVE_INFINITY, 0, 0))
  useFrame(({ gl, camera }) => {
    const moving = camera.position.distanceTo(last.current) > MOVED_METRES
    last.current.copy(camera.position)
    uploadStep(gl, moving)
  })
  return null
}

export function WarmAtlases({ index, maxSize }: { index: AtlasIndex | null; maxSize: number }) {
  useEffect(() => {
    const level = index ? warmLevel(availableLevels(index), maxSize) : null
    const urls =
      index && level ? Array.from({ length: index.count }, (_, i) => atlasUrl(index, i, level)) : []
    Promise.all(urls.map((url) => acquireTexture(url))).then(
      () => useWarmup.getState().mark({ atlases: index !== null }),
      () => useWarmup.getState().mark({ atlases: true }),
    )
    return () => {
      for (const url of urls) {
        releaseTexture(url)
      }
    }
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
