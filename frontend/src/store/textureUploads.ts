import {
  Box2,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  type Texture,
  Vector2,
} from 'three'

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
}

type Step = (uploader: Uploader) => void

interface Job {
  steps: Step[]
  done: () => void
}

const queue: Job[] = []

export function bandOffsets(height: number, rows = BAND_ROWS): number[] {
  return Array.from({ length: Math.ceil(height / rows) }, (_, i) => i * rows)
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

export function queueUpload(texture: Texture): Promise<Texture> {
  const image: unknown = texture.image
  const banded = bandable(image)
  const target = banded ? bandTarget(texture, image.width, image.height) : texture
  const steps = banded
    ? bandedSteps(texture, target, image.width, image.height)
    : [(uploader: Uploader) => uploader.initTexture(texture)]
  return new Promise((resolve) => {
    queue.push({
      steps,
      done: () => {
        if (banded) {
          image.close()
        }
        resolve(target)
      },
    })
  })
}

export function uploadStep(uploader: Uploader): boolean {
  const job = queue[0]
  const step = job?.steps.shift()
  step?.(uploader)
  if (job && job.steps.length === 0) {
    queue.shift()
    job.done()
  }
  return step !== undefined
}

export function pendingUploads(): number {
  return queue.length
}
