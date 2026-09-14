import type { Vec3 } from '../scene/math'
import { GONDOLA, SHELF } from './constants'

export interface Slot {
  itemId: string
  position: Vec3
  yaw: number
}

export interface Sign {
  id: string
  label: string
  position: Vec3
  yaw: number
  size: number
  maxWidth: number
}

export const BACK_Z = GONDOLA.frontZ - GONDOLA.sections * GONDOLA.sectionLength
export const END_PANEL = 0.03

export function shelfTop(shelf: number): number {
  return SHELF.topY - shelf * SHELF.rowGap
}
