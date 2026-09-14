import type { MoveInput } from './locomotion'

const FORWARD = ['KeyW', 'ArrowUp']
const BACKWARD = ['KeyS', 'ArrowDown']
const LEFT = ['KeyA', 'ArrowLeft']
const RIGHT = ['KeyD', 'ArrowRight']
const RUN = ['ShiftLeft', 'ShiftRight']

export const MOVEMENT_KEYS: ReadonlySet<string> = new Set([
  ...FORWARD,
  ...BACKWARD,
  ...LEFT,
  ...RIGHT,
  ...RUN,
])

const held = (keys: ReadonlySet<string>, codes: readonly string[]) =>
  Number(codes.some((code) => keys.has(code)))

export function inputFromKeys(keys: ReadonlySet<string>): MoveInput {
  return {
    forward: held(keys, FORWARD) - held(keys, BACKWARD),
    strafe: held(keys, RIGHT) - held(keys, LEFT),
    run: held(keys, RUN) === 1,
  }
}

export function isRunKey(code: string): boolean {
  return RUN.includes(code)
}

export interface Stick {
  x: number
  y: number
}

export const CENTERED: Stick = { x: 0, y: 0 }
const RUN_STICK = 0.95

const clampUnit = (value: number) => Math.min(1, Math.max(-1, value))

export function moveInput(keys: ReadonlySet<string>, stick: Stick = CENTERED): MoveInput {
  const fromKeys = inputFromKeys(keys)
  return {
    forward: clampUnit(fromKeys.forward - stick.y),
    strafe: clampUnit(fromKeys.strafe + stick.x),
    run: fromKeys.run || Math.hypot(stick.x, stick.y) > RUN_STICK,
  }
}
