import { describe, expect, it } from 'vitest'
import { boxesOverlap } from '../player/collision'
import { GONDOLA, ROOM, SHELF } from './constants'
import { shelfTop } from './geometry'
import {
  alongOf,
  coverYaw,
  endcapSpecs,
  GENRE_RUNS,
  NEW_RELEASES_SPEC,
  rowCapacity,
  runCollider,
  slotOn,
  TV_SPEC,
} from './runs'

const ALL_RUNS = [...GENRE_RUNS, NEW_RELEASES_SPEC, TV_SPEC, ...endcapSpecs()]

describe('run geometry', () => {
  it.each([
    [[1, 0], [0, -1], 0],
    [[0, 1], [1, 0], -Math.PI / 2],
    [[-1, 0], [0, 1], Math.PI],
    [[0, -1], [-1, 0], Math.PI / 2],
  ] as const)('normal %j reads along %j with covers turned %s', (normal, along, yaw) => {
    const spec = { ...TV_SPEC, normal }
    expect(alongOf(normal).map((v) => v + 0)).toEqual(along)
    expect(Math.abs(Math.sin((coverYaw(spec) - yaw) / 2))).toBeCloseTo(0)
  })

  it('places the first cover of a gondola face at its front, top shelf, facing the aisle', () => {
    const face = GENRE_RUNS[0]
    const slot = face && slotOn(face, 0, 0, 0, 'x')
    expect(face?.columns).toBe(8)
    expect(slot?.position[0]).toBeGreaterThan(GONDOLA.xs[1] ?? 0)
    expect(slot?.position[1]).toBeCloseTo(shelfTop(0) + 0.095)
    expect(slot?.position[2]).toBeLessThan(GONDOLA.frontZ)
    expect(slot?.position[2]).toBeGreaterThan(GONDOLA.frontZ - 0.15)
    expect(slot?.yaw).toBeCloseTo(0)
  })

  it('reads left to right as you face a run', () => {
    const face = GENRE_RUNS[0]
    const [a, b] = face ? [slotOn(face, 0, 0, 0, 'a'), slotOn(face, 0, 0, 1, 'b')] : []
    expect(b?.position[2]).toBeLessThan(a?.position[2] ?? 0)
  })
})

describe('store runs', () => {
  it('has 545 shelf rows for movies', () => {
    const rows = GENRE_RUNS.reduce((sum, spec) => sum + rowCapacity(spec), 0)
    expect(rows).toBe(545)
  })

  it('uses 8 covers a meter, 10 on the short back walls, 7 on endcaps', () => {
    expect(GENRE_RUNS.find((spec) => spec.id === 'wall-back-left')?.columns).toBe(10)
    expect(endcapSpecs()[0]?.columns).toBe(7)
    expect(SHELF.columnsPerMeter).toBe(8)
  })

  it('keeps every run inside the room', () => {
    const inside = ALL_RUNS.map(runCollider).every(
      (box) =>
        box.minX >= ROOM.minX &&
        box.maxX <= ROOM.maxX &&
        box.minZ >= ROOM.minZ &&
        box.maxZ <= ROOM.maxZ,
    )
    expect(inside).toBe(true)
  })

  it('never overlaps two runs', () => {
    const boxes = ALL_RUNS.map((spec) => [spec.id, runCollider(spec)] as const)
    const clashes = boxes.flatMap(([a, boxA], i) =>
      boxes
        .slice(i + 1)
        .filter(([, boxB]) => boxesOverlap(boxA, boxB))
        .map(([b]) => `${a}/${b}`),
    )
    expect(clashes).toEqual([])
  })
})
