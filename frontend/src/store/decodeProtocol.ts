export const BAND_ROWS = 512
export const BANDED_FROM = 2048

export const DECODE_OPTIONS: ImageBitmapOptions = {
  imageOrientation: 'flipY',
  premultiplyAlpha: 'none',
  colorSpaceConversion: 'none',
}

export interface BandRect {
  y: number
  height: number
}

export interface DecodeRequest {
  id: number
  url: string
}

export interface CancelRequest {
  id: number
  cancel: true
}

export interface DecodeReply {
  id: number
  width: number
  height: number
  bands: ImageBitmap[]
  error?: string
}

export function bandRects(width: number, height: number, rows = BAND_ROWS): BandRect[] {
  const banded = width > 0 && height >= BANDED_FROM
  const count = banded ? Math.ceil(height / rows) : 1
  return Array.from({ length: count }, (_, i) => ({
    y: banded ? i * rows : 0,
    height: banded ? Math.min(rows, height - i * rows) : height,
  }))
}

export function bandBytes(width: number, height: number): number[] {
  return bandRects(width, height).map((band) => width * band.height * 4)
}

export function mipChain(width: number, height: number): { width: number; height: number }[] {
  const levels = Math.floor(Math.log2(Math.max(width, height))) + 1
  return Array.from({ length: levels }, (_, i) => ({
    width: Math.max(1, width >> i),
    height: Math.max(1, height >> i),
  }))
}

export function isCancel(message: DecodeRequest | CancelRequest): message is CancelRequest {
  return 'cancel' in message
}
