import { useEffect, useState } from 'react'
import { SRGBColorSpace, type Texture, TextureLoader } from 'three'
import { atlasUrl } from '../api'
import type { AtlasIndex } from '../catalog/types'
import { levelKey, textureMb, urlLabel } from '../perf/mode'
import { perf } from '../perf/perf'
import { decodeInWorker } from './decoder'
import { workerDecodeSupported } from './textureSupport'
import { cancelUpload, type Priority, queueDecoded, queueUpload } from './textureUploads'

interface Entry {
  promise: Promise<Texture>
  texture: Texture | null
  users: number
  timer: ReturnType<typeof setTimeout> | undefined
  controller: AbortController
}

export interface ReleaseOptions {
  immediate?: boolean
}

const RELEASE_DELAY_MS = 45_000
const ANISOTROPY = 8
const entries = new Map<string, Entry>()
const imageLoader = new TextureLoader()

function decodesOffThread(): boolean {
  return workerDecodeSupported({
    worker: typeof Worker !== 'undefined',
    wasm: typeof WebAssembly !== 'undefined',
  })
}

async function mainThreadTexture(url: string, options: { label: string; priority: Priority }) {
  const texture = await imageLoader.loadAsync(url)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = ANISOTROPY
  texture.needsUpdate = true
  return queueUpload(texture, options)
}

function load(url: string, priority: Priority, signal: AbortSignal): Promise<Texture> {
  const options = { label: urlLabel(url), priority, anisotropy: ANISOTROPY }
  return decodesOffThread()
    ? decodeInWorker(url, signal).then((decoded) => queueDecoded(decoded, options))
    : mainThreadTexture(url, options)
}

function sizeOf(texture: Texture | null): { width: number; height: number } {
  const { width = 0, height = 0 } = (texture?.image ?? {}) as { width?: number; height?: number }
  return { width, height }
}

function resident(texture: Texture | null, sign: number) {
  const { width, height } = sizeOf(texture)
  const mb = sign * textureMb(width, height)
  perf.adjust(`tex.mb.${levelKey(width)}`, mb)
  perf.adjust('tex.mb', mb)
}

function release(texture: Texture | null) {
  texture?.dispose()
  const image = texture?.image as { close?: () => void } | undefined
  image?.close?.()
}

function createEntry(url: string, priority: Priority): Entry {
  const controller = new AbortController()
  const entry: Entry = {
    promise: Promise.resolve(null as unknown as Texture),
    texture: null,
    users: 0,
    timer: undefined,
    controller,
  }
  perf.adjust('decode.inflight', 1)
  entry.promise = load(url, priority, controller.signal)
    .finally(() => perf.adjust('decode.inflight', -1))
    .then(
      (texture) => {
        entry.texture = texture
        resident(texture, 1)
        perf.count('decode.count')
        return texture
      },
      (error: unknown) => {
        entries.delete(url)
        throw error
      },
    )
  return entry
}

function dispose(url: string) {
  const entry = entries.get(url)
  if (entry && entry.users === 0) {
    resident(entry.texture, -1)
    release(entry.texture)
    entries.delete(url)
  }
}

function abandon(url: string, entry: Entry) {
  entry.controller.abort()
  cancelUpload(urlLabel(url))
  entries.delete(url)
  entry.promise.catch(() => undefined)
}

const UNUSED: Record<'loading' | 'now' | 'later', (url: string, entry: Entry) => void> = {
  loading: abandon,
  now: (url) => dispose(url),
  later: (url, entry) => {
    entry.timer = setTimeout(() => dispose(url), RELEASE_DELAY_MS)
  },
}

export function acquireTexture(url: string, priority: Priority = 'warm'): Promise<Texture> {
  const entry = entries.get(url) ?? createEntry(url, priority)
  entries.set(url, entry)
  entry.users += 1
  clearTimeout(entry.timer)
  entry.timer = undefined
  return entry.promise
}

export function releaseTexture(url: string, { immediate = false }: ReleaseOptions = {}): void {
  const entry = entries.get(url)
  if (!entry) {
    return
  }
  entry.users = Math.max(0, entry.users - 1)
  const when = entry.texture === null ? 'loading' : immediate ? 'now' : 'later'
  if (entry.users === 0) {
    UNUSED[when](url, entry)
  }
}

export function isResident(url: string): boolean {
  return entries.get(url)?.texture !== null && entries.has(url)
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

export function atlasLevelUrl(index: AtlasIndex, atlas: number, size: number): string {
  return atlasUrl(index, atlas, size)
}
