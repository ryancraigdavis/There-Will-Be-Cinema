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
