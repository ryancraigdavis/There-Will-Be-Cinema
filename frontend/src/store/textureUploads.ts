import {
  Box2,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  type Texture,
  Vector2,
} from 'three'
import { levelKey } from '../perf/mode'
import { PERF_MODE, perf, timed } from '../perf/perf'

export const BAND_ROWS = 512
export const BANDED_FROM = 2048

export interface Uploader {
  initTexture: (texture: Texture) => void
  copyTextureToTexture: (
    source: Texture,
    target: Texture,
    region?: Box2 | null,
    position?: Vector2 | null,
  ) => void
  getContext?: () => { finish: () => void }
}

type Step = (uploader: Uploader) => void

interface Job {
  steps: Step[]
  bytes: number[]
  label: string
  level: string
  total: number
  done: () => void
}

const queue: Job[] = []
const SETTLE: Record<typeof PERF_MODE, (uploader: Uploader) => void> = {
  off: () => undefined,
  on: () => undefined,
  sync: (uploader) => uploader.getContext?.().finish(),
}

export function bandOffsets(height: number, rows = BAND_ROWS): number[] {
  return Array.from({ length: Math.ceil(height / rows) }, (_, i) => i * rows)
}

export function bandBytes(width: number, height: number): number[] {
  return [0, ...bandOffsets(height).map((y) => width * Math.min(BAND_ROWS, height - y) * 4)]
}

export function bandedSteps(
  source: Texture,
  target: Texture,
  width: number,
  height: number,
): Step[] {
  const offsets = bandOffsets(height)
  const last = offsets.length - 1
  return [
    (uploader) => uploader.initTexture(target),
    ...offsets.map(
      (y, i): Step =>
        (uploader) => {
          target.generateMipmaps = i === last
          const region = new Box2(
            new Vector2(0, y),
            new Vector2(width, Math.min(height, y + BAND_ROWS)),
          )
          uploader.copyTextureToTexture(source, target, region, new Vector2(0, y))
        },
    ),
  ]
}

function bandTarget(source: Texture, width: number, height: number): Texture {
  const target = new DataTexture(null, width, height)
  target.source.dataReady = false
  target.colorSpace = source.colorSpace
  target.anisotropy = source.anisotropy
  target.flipY = false
  target.magFilter = LinearFilter
  target.minFilter = LinearMipmapLinearFilter
  target.generateMipmaps = true
  target.needsUpdate = true
  return target
}

function bandable(image: unknown): image is ImageBitmap {
  return (
    typeof ImageBitmap !== 'undefined' &&
    image instanceof ImageBitmap &&
    image.height >= BANDED_FROM
  )
}

function sizeOf(image: unknown): { width: number; height: number } {
  const { width = 0, height = 0 } = (image ?? {}) as { width?: number; height?: number }
  return { width, height }
}

export function queueUpload(texture: Texture, label = texture.name): Promise<Texture> {
  const image: unknown = texture.image
  const banded = bandable(image)
  const { width, height } = sizeOf(image)
  const target = banded ? bandTarget(texture, width, height) : texture
  const steps = banded
    ? bandedSteps(texture, target, width, height)
    : [(uploader: Uploader) => uploader.initTexture(texture)]
  return new Promise((resolve) => {
    queue.push({
      steps,
      bytes: banded ? bandBytes(width, height) : [width * height * 4],
      label,
      level: levelKey(width),
      total: steps.length,
      done: () => {
        if (banded) {
          image.close()
        }
        resolve(target)
      },
    })
  })
}

function runStep(job: Job, step: Step, uploader: Uploader) {
  const bytes = job.bytes.shift() ?? 0
  const label = `upload ${job.label} ${job.total - job.steps.length}/${job.total}`
  perf.count('upload.steps')
  perf.count(`upload.steps.${job.level}`)
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

export function uploadStep(uploader: Uploader): boolean {
  const job = queue[0]
  const step = job?.steps.shift()
  if (job && step) {
    runStep(job, step, uploader)
  }
  if (job && job.steps.length === 0) {
    queue.shift()
    job.done()
  }
  perf.gauge('upload.queue', queue.length)
  return step !== undefined
}

export function pendingUploads(): number {
  return queue.length
}
