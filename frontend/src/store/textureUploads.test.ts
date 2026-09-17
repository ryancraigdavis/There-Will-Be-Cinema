import { DataTexture, Texture } from 'three'
import { describe, expect, it } from 'vitest'
import {
  BAND_ROWS,
  bandedSteps,
  bandOffsets,
  pendingUploads,
  queueUpload,
  type Uploader,
  uploadStep,
} from './textureUploads'

function recorder() {
  const calls: string[] = []
  const uploader: Uploader = {
    initTexture: (texture) => calls.push(`init ${texture.name}`),
    copyTextureToTexture: (_source, target, region, position) =>
      calls.push(
        `copy rows ${region?.min.y}-${region?.max.y} to ${position?.y} mips=${target.generateMipmaps}`,
      ),
  }
  return { calls, uploader }
}

describe('uploads', () => {
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
})

describe('banded uploads', () => {
  it.each([
    [4096, [0, 512, 1024, 1536, 2048, 2560, 3072, 3584]],
    [2048, [0, 512, 1024, 1536]],
    [1000, [0, 512]],
  ])('splits %i rows into bands', (height, expected) => {
    expect(bandOffsets(height)).toEqual(expected)
  })

  it('allocates once, copies each band in place, and builds mipmaps only on the last', () => {
    const { calls, uploader } = recorder()
    const target = Object.assign(new DataTexture(null, 2048, 2048), { name: 'atlas' })
    for (const step of bandedSteps(new Texture(), target, 2048, 2048)) {
      step(uploader)
    }
    expect(calls).toEqual([
      'init atlas',
      'copy rows 0-512 to 0 mips=false',
      `copy rows 512-${2 * BAND_ROWS} to 512 mips=false`,
      'copy rows 1024-1536 to 1024 mips=false',
      'copy rows 1536-2048 to 1536 mips=true',
    ])
  })

  it('clamps the last band to the image', () => {
    const { calls, uploader } = recorder()
    const steps = bandedSteps(new Texture(), new DataTexture(null, 900, 900), 900, 900)
    for (const step of steps) {
      step(uploader)
    }
    expect(calls.at(-1)).toBe('copy rows 512-900 to 512 mips=true')
  })
})
