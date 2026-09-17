import { useEffect, useState } from 'react'
import { ImageBitmapLoader, SRGBColorSpace, Texture, TextureLoader } from 'three'
import { atlasUrl } from '../api'
import type { AtlasIndex } from '../catalog/types'
import { bitmapsSupported } from './textureSupport'
import { queueUpload } from './textureUploads'

interface Entry {
  promise: Promise<Texture>
  texture: Texture | null
  users: number
  timer: ReturnType<typeof setTimeout> | undefined
}

const RELEASE_DELAY_MS = 45_000
const entries = new Map<string, Entry>()

let bitmapLoader: ImageBitmapLoader | null = null
const imageLoader = new TextureLoader()

function decodesOffThread(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    bitmapsSupported(navigator.userAgent, typeof createImageBitmap === 'function')
  )
}

async function bitmapTexture(url: string): Promise<Texture> {
  bitmapLoader ??= new ImageBitmapLoader().setOptions({
    imageOrientation: 'flipY',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
  })
  const texture = new Texture(await bitmapLoader.loadAsync(url))
  texture.flipY = false
  return texture
}

async function decode(url: string): Promise<Texture> {
  const texture = decodesOffThread() ? await bitmapTexture(url) : await imageLoader.loadAsync(url)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function release(texture: Texture | null) {
  texture?.dispose()
  const image = texture?.image as { close?: () => void } | undefined
  image?.close?.()
}

function createEntry(url: string): Entry {
  const entry: Entry = {
    promise: Promise.resolve(null as unknown as Texture),
    texture: null,
    users: 0,
    timer: undefined,
  }
  entry.promise = decode(url)
    .then(queueUpload)
    .then(
      (texture) => {
        entry.texture = texture
        return texture
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
    release(entry.texture)
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
