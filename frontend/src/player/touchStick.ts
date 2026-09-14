import type { Stick } from './keys'

export const touchStick: Stick = { x: 0, y: 0 }

export function setStick(x: number, y: number): void {
  touchStick.x = x
  touchStick.y = y
}
