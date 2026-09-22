import type { Vec3 } from '../scene/math'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import { ROOM } from './constants'
import type { Sign } from './geometry'
import type { Banner } from './layout'

export interface TextSpec {
  id: string
  text: string
  font: string
  fontSize: number
  letterSpacing: number
  maxWidth: number
  textAlign: 'left' | 'center'
  anchorX: 'left' | 'center'
  anchorY: 'middle'
  color: string
  position: Vec3
  yaw: number
}

export const BANNER_SIZE = { width: 2.1, height: 0.42, depth: 0.05 } as const
export const BANNER_FACES = [0.031, -0.031] as const
export const ROD_XS = [-0.7, 0.7] as const

const DISPLAY = {
  font: FONTS.display,
  textAlign: 'center',
  anchorX: 'center',
  anchorY: 'middle',
} as const

export function signSpec(sign: Sign): TextSpec {
  return {
    ...DISPLAY,
    id: `sign:${sign.id}`,
    text: sign.label.toUpperCase(),
    fontSize: sign.size,
    letterSpacing: 0.08,
    maxWidth: sign.maxWidth,
    color: PALETTE.gold,
    position: sign.position,
    yaw: sign.yaw,
  }
}

function onFace(banner: Banner, face: number, y: number): Pick<TextSpec, 'position' | 'yaw'> {
  const [x, by, z] = banner.position
  return { position: [x, by + y, z + face], yaw: face > 0 ? 0 : Math.PI }
}

export function bannerSpecs(banner: Banner): TextSpec[] {
  return BANNER_FACES.flatMap((face) => [
    {
      ...DISPLAY,
      ...onFace(banner, face, 0.1),
      id: `banner:${banner.id}:${face}:label`,
      text: banner.label.toUpperCase(),
      fontSize: 0.15,
      letterSpacing: 0.14,
      maxWidth: Number.POSITIVE_INFINITY,
      color: PALETTE.gold,
    },
    {
      ...DISPLAY,
      ...onFace(banner, face, -0.09),
      id: `banner:${banner.id}:${face}:genres`,
      text: banner.genres.join(' · ').toUpperCase(),
      fontSize: 0.075,
      letterSpacing: 0.1,
      maxWidth: BANNER_SIZE.width - 0.2,
      color: PALETTE.cream,
    },
  ])
}

export function rodLength(bannerY: number): number {
  return ROOM.height - bannerY - BANNER_SIZE.height / 2
}

export function storeTextSpecs(signs: readonly Sign[], banners: readonly Banner[]): TextSpec[] {
  return [...signs.map(signSpec), ...banners.flatMap(bannerSpecs)]
}
