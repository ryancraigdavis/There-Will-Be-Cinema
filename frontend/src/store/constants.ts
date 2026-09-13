export const ROOM = { minX: -7, maxX: 7, minZ: -9, maxZ: 8, height: 3, wall: 0.4 } as const

export const BOX = { spine: 0.026, height: 0.19, cover: 0.105 } as const

export const SHELF = {
  slots: 32,
  pitch: 0.03,
  rows: 5,
  topY: 1.62,
  rowGap: 0.33,
  thickness: 0.02,
  depth: 0.3,
  margin: 0.02,
  inset: 0.012,
} as const

export const GONDOLA = {
  xs: [-3.66, -1.22, 1.22, 3.66],
  frontZ: -1.6,
  sections: 5,
  sectionLength: 1,
  divider: 0.04,
  height: 1.95,
  plinth: 0.12,
  signY: 2.12,
} as const

export const MIN_GENRE_SIZE = 20
export const OTHER_GENRE = 'More Movies'
export const RENDERED_AISLES: readonly number[] = [0]
