import { DataTexture, Texture } from 'three'
import { describe, expect, it } from 'vitest'
import {
  bandedSteps,
  bandOffsets,
  bandTarget,
  cancelUpload,
  pendingUploads,
  queueBanded,
  queueUpload,
  type Uploader,
  uploadStep,
} from './textureUploads'

function recorder() {
  const calls: string[] = []
  const uploader: Uploader = {
    initTexture: (texture) => calls.push(`init ${texture.name || 'target'}`),
    copyTextureToTexture: (source, target, _region, position) =>
      calls.push(
        `copy ${(source.image as ImageBitmap).height} rows to ${position?.y} mips=${target.generateMipmaps}`,
      ),
  }
  return { calls, uploader }
}

function bitmap(height: number, width = 64): ImageBitmap {
  let open = true
  return {
    width,
    height,
    close: () => {
      open = false
    },
    get closed() {
      return !open
    },
  } as unknown as ImageBitmap
}

const drain = (uploader: Uploader) => {
  while (uploadStep(uploader)) {
    // run the queue dry
  }
}

describe('upload queue', () => {
  it('runs one step per frame and resolves each texture after its last step', async () => {
    const { calls, uploader } = recorder()
    const first = Object.assign(new Texture(), { name: 'first' })
    const second = Object.assign(new Texture(), { name: 'second' })
    const ready = [queueUpload(first), queueUpload(second)]
    expect(pendingUploads()).toBe(2)
    expect(uploadStep(uploader)).toBe(true)
    expect(await ready[0]).toBe(first)
    expect(uploadStep(uploader)).toBe(true)
    expect(await ready[1]).toBe(second)
    expect(uploadStep(uploader)).toBe(false)
    expect(calls).toEqual(['init first', 'init second'])
    expect(pendingUploads()).toBe(0)
  })

  it('serves warm jobs before upgrades and holds upgrades while the camera moves', async () => {
    const { calls, uploader } = recorder()
    const sharp = queueBanded(
      { width: 64, height: 2048, bands: [bitmap(1024), bitmap(1024)] },
      {
        label: 'sharp',
        priority: 'upgrade',
      },
    )
    const warm = queueUpload(Object.assign(new Texture(), { name: 'warm' }), { priority: 'warm' })
    expect(uploadStep(uploader, true)).toBe(true)
    expect(calls).toEqual(['init warm'])
    expect(uploadStep(uploader, true)).toBe(false)
    expect(uploadStep(uploader, false)).toBe(true)
    expect(calls.at(-1)).toBe('init target')
    drain(uploader)
    expect(await warm).toBeInstanceOf(Texture)
    expect(await sharp).toBeInstanceOf(DataTexture)
  })

  it('cancels a queued job by label, closing its bitmaps', async () => {
    const { uploader } = recorder()
    const bands = [bitmap(1024), bitmap(1024)]
    const promise = queueBanded({ width: 64, height: 2048, bands }, { label: '3.webp' })
    expect(cancelUpload('3.webp')).toBe(true)
    expect(cancelUpload('3.webp')).toBe(false)
    await expect(promise).rejects.toThrow('cancelled')
    expect(bands.every((band) => (band as unknown as { closed: boolean }).closed)).toBe(true)
    expect(uploadStep(uploader)).toBe(false)
  })
})

describe('banded uploads', () => {
  it.each([
    [4096, [0, 512, 1024, 1536, 2048, 2560, 3072, 3584]],
    [2048, [0, 512, 1024, 1536]],
    [1000, [0]],
  ])('splits %i rows into bands', (height, expected) => {
    expect(bandOffsets(height)).toEqual(expected)
  })

  it('allocates once, copies each band in place, closes it, and builds mipmaps only on the last', () => {
    const { calls, uploader } = recorder()
    const bands = [bitmap(512), bitmap(512), bitmap(512), bitmap(512)]
    for (const step of bandedSteps(bands, bandTarget(64, 2048, 8))) {
      step(uploader)
    }
    expect(calls).toEqual([
      'init target',
      'copy 512 rows to 0 mips=false',
      'copy 512 rows to 512 mips=false',
      'copy 512 rows to 1024 mips=false',
      'copy 512 rows to 1536 mips=true',
    ])
    expect(bands.every((band) => (band as unknown as { closed: boolean }).closed)).toBe(true)
  })

  it('reserves the whole mip chain up front without generating it', () => {
    const target = bandTarget(4096, 4096, 8)
    expect(target.generateMipmaps).toBe(false)
    expect(target.mipmaps).toHaveLength(13)
    expect(target.source.dataReady).toBe(false)
    expect(target.anisotropy).toBe(8)
  })
})
