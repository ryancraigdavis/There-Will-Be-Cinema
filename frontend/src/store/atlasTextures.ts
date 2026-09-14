import { useEffect, useState } from 'react'
import { SRGBColorSpace, type Texture, TextureLoader } from 'three'
import { atlasUrl } from '../api'
import type { AtlasIndex } from '../catalog/types'

interface Entry {
  promise: Promise<Texture>
  texture: Texture | null
  users: number
  timer: ReturnType<typeof setTimeout> | undefined
}

const RELEASE_DELAY_MS = 10_000
const loader = new TextureLoader()
const entries = new Map<string, Entry>()

function configure(texture: Texture): Texture {
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function createEntry(url: string): Entry {
  const entry: Entry = {
    promise: Promise.resolve(null as unknown as Texture),
    texture: null,
    users: 0,
    timer: undefined,
  }
  entry.promise = loader.loadAsync(url).then(
    (texture) => {
      entry.texture = configure(texture)
      return entry.texture
    },
    (error: unknown) => {
      entries.delete(url)
      throw error
    },
  )
  return entry
}

function disposeIfUnused(url: string) {
  const entry = entries.get(url)
  if (entry && entry.users === 0) {
    entry.texture?.dispose()
    entries.delete(url)
  }
}

export function acquireTexture(url: string): Promise<Texture> {
  const entry = entries.get(url) ?? createEntry(url)
  entries.set(url, entry)
  entry.users += 1
  clearTimeout(entry.timer)
  entry.timer = undefined
  return entry.promise
}

export function releaseTexture(url: string): void {
  const entry = entries.get(url)
  if (!entry) {
    return
  }
  entry.users = Math.max(0, entry.users - 1)
  entry.timer =
    entry.users === 0 ? setTimeout(() => disposeIfUnused(url), RELEASE_DELAY_MS) : entry.timer
}

export function useTexture(url: string | null): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null)
  useEffect(() => {
    if (!url) {
      return
    }
    let live = true
    acquireTexture(url).then(
      (loaded) => live && setTexture(loaded),
      () => undefined,
    )
    return () => {
      live = false
      releaseTexture(url)
    }
  }, [url])
  return texture
}

export function useAtlasTexture(
  index: AtlasIndex | null,
  atlas: number,
  size: number | null,
): Texture | null {
  return useTexture(index && size && atlas >= 0 ? atlasUrl(index, atlas, size) : null)
}
