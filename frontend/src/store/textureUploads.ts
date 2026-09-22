import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  type Texture,
  Vector2,
} from 'three'
import { levelKey } from '../perf/mode'
import { PERF_MODE, perf, timed } from '../perf/perf'
import { bandBytes, bandRects, flippedY, mipChain, type PixelBand } from './decodeProtocol'
import type { Decoded } from './decoder'

export { BAND_ROWS, BANDED_FROM } from './decodeProtocol'

export type Priority = 'warm' | 'upgrade'

export interface Uploader {
  initTexture: (texture: Texture) => void
  copyTextureToTexture: (
    source: Texture,
    target: Texture,
    region?: null,
    position?: Vector2 | null,
  ) => void
  getContext?: () => { finish: () => void }
}

export interface UploadOptions {
  label?: string
  priority?: Priority
  anisotropy?: number
}

type Step = (uploader: Uploader) => void

interface Job {
  id: number
  steps: Step[]
  bytes: number[]
  label: string
  level: string
  total: number
  priority: Priority
  done: () => void
  drop: () => void
}

const queue: Job[] = []
let nextId = 1

const SETTLE: Record<typeof PERF_MODE, (uploader: Uploader) => void> = {
  off: () => undefined,
  on: () => undefined,
  sync: (uploader) => uploader.getContext?.().finish(),
}

const RUNNABLE: Record<Priority, (moving: boolean) => boolean> = {
  warm: () => true,
  upgrade: (moving) => !moving,
}

export function bandOffsets(height: number, rows?: number): number[] {
  return bandRects(1, height, rows).map((band) => band.y)
}

function bandTexture(band: PixelBand, width: number): Texture {
  const texture = new DataTexture(band.data, width, band.height)
  texture.flipY = false
  texture.colorSpace = SRGBColorSpace
  return texture
}

export function bandedSteps(
  bands: readonly PixelBand[],
  target: Texture,
  width: number,
  height: number,
): Step[] {
  const last = bands.length - 1
  return [
    (uploader) => uploader.initTexture(target),
    ...bands.map(
      (band, i): Step =>
        (uploader) => {
          target.generateMipmaps = i === last
          const at = new Vector2(0, flippedY(height, band))
          uploader.copyTextureToTexture(bandTexture(band, width), target, null, at)
        },
    ),
  ]
}

export function bandTarget(width: number, height: number, anisotropy: number): Texture {
  const target = new DataTexture(null, width, height)
  target.source.dataReady = false
  target.mipmaps = mipChain(width, height).map((level) => ({
    ...level,
    data: null,
  })) as unknown as Texture['mipmaps']
  target.colorSpace = SRGBColorSpace
  target.anisotropy = anisotropy
  target.flipY = false
  target.magFilter = LinearFilter
  target.minFilter = LinearMipmapLinearFilter
  target.generateMipmaps = false
  target.needsUpdate = true
  return target
}

function enqueue(job: Job) {
  const at = job.priority === 'warm' ? queue.findIndex((other) => other.priority === 'upgrade') : -1
  queue.splice(at === -1 ? queue.length : at, 0, job)
}

function job(
  steps: Step[],
  bytes: number[],
  width: number,
  { label = '', priority = 'warm' }: UploadOptions,
  finish: { done: () => void; drop: () => void },
): Job {
  return {
    id: nextId++,
    steps,
    bytes,
    label,
    level: levelKey(width),
    total: steps.length,
    priority,
    ...finish,
  }
}

export function queueUpload(texture: Texture, options: UploadOptions = {}): Promise<Texture> {
  const { width = 0, height = 0 } = (texture.image ?? {}) as { width?: number; height?: number }
  return new Promise((resolve, reject) => {
    const steps = [(uploader: Uploader) => uploader.initTexture(texture)]
    enqueue(
      job(steps, [width * height * 4], width, options, {
        done: () => resolve(texture),
        drop: () => reject(new Error('upload cancelled')),
      }),
    )
  })
}

export function queueDecoded(decoded: Decoded, options: UploadOptions = {}): Promise<Texture> {
  const { width, height, bands } = decoded
  const target = bandTarget(width, height, options.anisotropy ?? 8)
  return new Promise((resolve, reject) => {
    enqueue(
      job(
        bandedSteps(bands, target, width, height),
        [0, ...bandBytes(width, height)],
        width,
        options,
        {
          done: () => resolve(target),
          drop: () => reject(new Error('upload cancelled')),
        },
      ),
    )
  })
}

export function cancelUpload(label: string): boolean {
  const index = queue.findIndex((queued) => queued.label === label)
  const dropped = queue.splice(index, index === -1 ? 0 : 1)
  for (const queued of dropped) {
    queued.drop()
  }
  return dropped.length > 0
}

function runStep(queued: Job, step: Step, uploader: Uploader) {
  const bytes = queued.bytes.shift() ?? 0
  const label = `upload ${queued.label} ${queued.total - queued.steps.length}/${queued.total}`
  perf.count('upload.steps')
  perf.count(`upload.steps.${queued.level}`)
  perf.count('upload.bytes', bytes)
  timed(
    label,
    () => {
      step(uploader)
      SETTLE[PERF_MODE](uploader)
    },
    bytes,
  )
}

export function uploadStep(uploader: Uploader, moving = false): boolean {
  const queued = queue.find((candidate) => RUNNABLE[candidate.priority](moving))
  const step = queued?.steps.shift()
  if (queued && step) {
    runStep(queued, step, uploader)
  }
  if (queued && queued.steps.length === 0) {
    queue.splice(queue.indexOf(queued), 1)
    queued.done()
  }
  perf.gauge('upload.queue', queue.length)
  return step !== undefined
}

export function pendingUploads(): number {
  return queue.length
}
