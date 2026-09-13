import type { CatalogItem } from './types'

export type BadgeKind = '4k' | 'dv' | 'hdr' | 'atmos' | 'dtsx' | 'tv'

export interface Badge {
  kind: BadgeKind
  label: string
}

interface BadgeRule {
  kind: BadgeKind
  test: (item: CatalogItem) => boolean
  label: (item: CatalogItem) => string
}

const PLAIN_HDR = new Set(['HDR10', 'HDR10+', 'HLG'])

const RULES: BadgeRule[] = [
  { kind: 'tv', test: (item) => item.type === 'Series', label: () => 'TV' },
  { kind: '4k', test: (item) => item.is4k, label: () => '4K' },
  {
    kind: 'dv',
    test: (item) => item.hdr === 'Dolby Vision',
    label: (item) => ['DV', item.dvProfile].filter(Boolean).join(' '),
  },
  { kind: 'hdr', test: (item) => PLAIN_HDR.has(item.hdr ?? ''), label: (item) => item.hdr ?? '' },
  { kind: 'atmos', test: (item) => item.atmos, label: () => 'Atmos' },
  { kind: 'dtsx', test: (item) => item.dtsx, label: () => 'DTS:X' },
]

export function badgesFor(item: CatalogItem): Badge[] {
  return RULES.filter((rule) => rule.test(item)).map((rule) => ({
    kind: rule.kind,
    label: rule.label(item),
  }))
}
