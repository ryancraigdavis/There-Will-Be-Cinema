export const ROOM = { minX: -7, maxX: 7, minZ: -13.4, maxZ: 8, height: 3, wall: 0.4 } as const

export const BOX = { spine: 0.026, height: 0.19, cover: 0.105 } as const

export const SHELF = {
  rows: 5,
  topY: 1.62,
  rowGap: 0.33,
  thickness: 0.02,
  depth: 0.14,
  backing: 0.02,
  margin: 0.02,
  inset: 0.01,
  columnsPerMeter: 8,
} as const

export const GONDOLA = {
  xs: [-3.66, -1.22, 1.22, 3.66],
  frontZ: -1.6,
  sections: 9,
  sectionLength: 1,
  divider: 0.04,
  height: 2.02,
  plinth: 0.12,
  signY: 2.12,
} as const

export const DISPLAY_DEPTH = SHELF.backing + SHELF.depth + 0.02
export const WALL_GAP = 0.02
export const ENDCAP = { width: 0.9, rows: 4 } as const
export const SIGN_SIZE = { section: 0.1, wall: 0.15, endcap: 0.07 } as const
export const MIN_GENRE_SIZE = 20
export const OTHER_GENRE = 'More Movies'
