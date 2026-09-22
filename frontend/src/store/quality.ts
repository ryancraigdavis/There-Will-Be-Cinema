export type Tier = 'desktop' | 'mobile'

export interface Quality {
  tier: Tier
  maxAtlasSize: number
  fullSheets: number
  maxDpr: number
  fallbackDpr: number
}

export interface Device {
  coarsePointer: boolean
  maxTextureSize: number
}

const TIERS: Record<Tier, Omit<Quality, 'tier'>> = {
  desktop: { maxAtlasSize: 4096, fullSheets: 2, maxDpr: 1.75, fallbackDpr: 1 },
  mobile: { maxAtlasSize: 2048, fullSheets: 1, maxDpr: 1.5, fallbackDpr: 1 },
}

export function qualityFor(device: Device): Quality {
  const tier: Tier = device.coarsePointer ? 'mobile' : 'desktop'
  const base = TIERS[tier]
  return { tier, ...base, maxAtlasSize: Math.min(base.maxAtlasSize, device.maxTextureSize) }
}

export function dprAfter(quality: Quality, declined: boolean): number {
  return declined ? quality.fallbackDpr : quality.maxDpr
}
