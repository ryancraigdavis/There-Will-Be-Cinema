import type { Vec3 } from '../scene/math'
import { DISPLAY_DEPTH, GONDOLA, SHELF } from './constants'
import { END_PANEL, shelfTop } from './geometry'
import type { GondolaFrame } from './layout'
import { partYaw, pointOn, type RunSpec } from './runs'

export interface BoxPart {
  position: Vec3
  yaw: number
  size: Vec3
}

export interface ShelvingParts {
  boards: BoxPart[]
  trims: BoxPart[]
  panels: BoxPart[]
  blocks: BoxPart[]
}

const HEADER_HEIGHT = 0.2
const TRIM = { depth: 0.008, height: 0.036, drop: 0.018 } as const
const END_PANEL_WIDTH = 2 * (GONDOLA.divider / 2 + DISPLAY_DEPTH) + 0.02

const range = (count: number) => Array.from({ length: count }, (_, i) => i)

function gondolaParts(frame: GondolaFrame): ShelvingParts {
  const length = frame.frontZ - frame.backZ
  const z = (frame.frontZ + frame.backZ) / 2
  return {
    boards: [],
    trims: [],
    panels: [
      {
        position: [frame.x, GONDOLA.height / 2, z],
        yaw: 0,
        size: [GONDOLA.divider, GONDOLA.height, length],
      },
      ...[frame.frontZ, frame.backZ].map((endZ) => ({
        position: [frame.x, GONDOLA.height / 2, endZ] as Vec3,
        yaw: 0,
        size: [END_PANEL_WIDTH, GONDOLA.height, END_PANEL] as Vec3,
      })),
    ],
    blocks: [],
  }
}

function runParts(spec: RunSpec): ShelvingParts {
  const yaw = partYaw(spec)
  const at = (out: number, y: number) => pointOn(spec, spec.length / 2, out, y)
  const rows = range(spec.rows)
  return {
    boards: rows.map((row) => ({
      position: at(SHELF.backing + SHELF.depth / 2, shelfTop(row) - SHELF.thickness / 2),
      yaw,
      size: [spec.length, SHELF.thickness, SHELF.depth],
    })),
    trims: rows.map((row) => ({
      position: at(SHELF.backing + SHELF.depth + TRIM.depth / 2, shelfTop(row) - TRIM.drop),
      yaw,
      size: [spec.length, TRIM.height, TRIM.depth],
    })),
    panels: [
      {
        position: at(SHELF.backing / 2, GONDOLA.height / 2),
        yaw,
        size: [spec.length, GONDOLA.height, SHELF.backing],
      },
    ],
    blocks: [
      {
        position: at(DISPLAY_DEPTH / 2, GONDOLA.plinth / 2),
        yaw,
        size: [spec.length, GONDOLA.plinth, DISPLAY_DEPTH],
      },
      {
        position: at(DISPLAY_DEPTH / 2, GONDOLA.signY),
        yaw,
        size: [spec.length, HEADER_HEIGHT, DISPLAY_DEPTH],
      },
    ],
  }
}

export function shelvingParts(
  gondolas: readonly GondolaFrame[],
  runs: readonly RunSpec[],
): ShelvingParts {
  const parts = [...gondolas.map(gondolaParts), ...runs.map(runParts)]
  return {
    boards: parts.flatMap((part) => part.boards),
    trims: parts.flatMap((part) => part.trims),
    panels: parts.flatMap((part) => part.panels),
    blocks: parts.flatMap((part) => part.blocks),
  }
}
