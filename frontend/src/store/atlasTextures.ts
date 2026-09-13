import { useEffect, useState } from 'react'
import { SRGBColorSpace, type Texture, TextureLoader } from 'three'
import { atlasUrl } from '../api'
import type { AtlasIndex } from '../catalog/types'

const loader = new TextureLoader()
const pending = new Map<string, Promise<Texture>>()

function loadTexture(url: string): Promise<Texture> {
  const request =
    pending.get(url) ??
    loader.loadAsync(url).then((texture) => {
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = 8
      texture.needsUpdate = true
      return texture
    })
  pending.set(url, request)
  return request
}

export function useTexture(url: string | null): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null)
  useEffect(() => {
    let live = true
    if (url) {
      loadTexture(url).then(
        (loaded) => live && setTexture(loaded),
        () => undefined,
      )
    }
    return () => {
      live = false
    }
  }, [url])
  return texture
}

export function useAtlasTexture(index: AtlasIndex | null, atlas: number): Texture | null {
  return useTexture(index && atlas >= 0 ? atlasUrl(index, atlas) : null)
}
