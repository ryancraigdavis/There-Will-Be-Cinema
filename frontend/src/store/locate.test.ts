import { describe, expect, it } from 'vitest'
import { toItem } from '../api'
import type { CatalogItem } from '../catalog/types'
import { isBlocked } from '../player/collision'
import { EYE_HEIGHT, PLAYER_RADIUS } from '../player/locomotion'
import { sceneColliders } from '../scene/colliders'
import { rawItem } from '../test/fixtures'
import { buildStorePlan } from './layout'
import { aisleOf, buildLocations, genreStops, STAND_BACK, standingPose } from './locate'
import { GENRE_RUNS, NEW_RELEASES_SPEC, type RunSpec, slotOn, TV_SPEC } from './runs'

const standing = (pose: { position: readonly number[] }) => ({
  x: pose.position[0] as number,
  z: pose.position[2] as number,
})

function movies(genre: string, count: number): CatalogItem[] {
  return Array.from({ length: count }, (_, i) => {
    const title = `${genre} ${String(i).padStart(4, '0')}`
    return toItem(
      rawItem({ id: `${genre}-${i}`, ti: title, st: title.toLowerCase(), pg: genre, g: [genre] }),
    )
  })
}

const series = toItem(rawItem({ id: 'show', t: 'Series', ti: 'Show', st: 'show', pg: 'Drama' }))
const library = [...movies('Drama', 400), ...movies('Action', 60), series]
const plan = buildStorePlan(library, [])
const locations = buildLocations(plan)

const first = GENRE_RUNS[0] as RunSpec

describe('standingPose', () => {
  it('stands one step out along the shelf normal', () => {
    const pose = standingPose([1.24, 1.5, -3], first)
    expect(pose.position[0]).toBeCloseTo(1.24 + first.normal[0] * STAND_BACK)
    expect(pose.position[1]).toBe(EYE_HEIGHT)
    expect(pose.position[2]).toBeCloseTo(-3 + first.normal[1] * STAND_BACK)
  })

  it('looks back at the tape', () => {
    const pose = standingPose([1.24, 1.5, -3], first)
    const forward = [-Math.sin(pose.yaw), -Math.cos(pose.yaw)]
    expect(forward[0]).toBeCloseTo(-first.normal[0])
    expect(forward[1]).toBeCloseTo(-first.normal[1])
  })

  it('tilts toward a low shelf', () => {
    expect(standingPose([1.24, 0.4, -3], first).pitch).toBeLessThan(0)
    expect(standingPose([1.24, EYE_HEIGHT, -3], first).pitch).toBeCloseTo(0)
  })
})

describe('aisleOf', () => {
  it.each([
    ['gondola-1-east', 'Aisle 3'],
    ['wall-left', 'Aisle 1'],
    ['wall-right', 'Aisle 5'],
    ['wall-back-left', 'Back wall'],
  ])('names the walkway for %s', (id, expected) => {
    const run = plan.runs.find((spec) => spec.id === id) as RunSpec
    expect(aisleOf(run)).toBe(expected)
  })

  it.each([
    [NEW_RELEASES_SPEC, 'New Releases'],
    [TV_SPEC, 'TV on DVD'],
  ])('names displays by kind', (run, expected) => {
    expect(aisleOf(run)).toBe(expected)
  })
})

describe('buildLocations', () => {
  it('locates every shelved title', () => {
    const shelved = new Set(plan.sections.flatMap((s) => s.slots.map((slot) => slot.itemId)))
    expect(locations.size).toBe(shelved.size)
  })

  it('reports the bay sign and aisle', () => {
    const found = locations.get('Drama-0')
    expect(found?.bay).toMatch(/^Drama /)
    expect(found?.aisle).toMatch(/^Aisle /)
  })

  it('prefers the genre shelf over a display copy', () => {
    const onDisplay = plan.sections.filter((s) => s.run.kind === 'new-releases')
    const alsoNew = onDisplay.flatMap((s) => s.slots).map((slot) => slot.itemId)
    expect(alsoNew.length).toBeGreaterThan(0)
    for (const id of alsoNew) {
      expect(locations.get(id)?.aisle).toMatch(/^Aisle /)
    }
  })

  it('sends series to the TV wall', () => {
    expect(locations.get('show')?.aisle).toBe('TV on DVD')
  })
})

describe('genreStops', () => {
  const stops = genreStops(plan)

  it('stops at the first bay of a genre', () => {
    const firstDrama = locations.get('Drama-0')
    expect(stops.get('Drama')?.pose).toEqual(firstDrama?.pose)
  })

  it('covers every directory entry', () => {
    expect(plan.directory.every((entry) => stops.has(entry.genre))).toBe(true)
  })
})

describe('standing clear of the store', () => {
  const packed = buildStorePlan(movies('Drama', 3600), [])
  const colliders = sceneColliders(packed)
  const cornerRun = packed.runs.find((run) => run.id === 'wall-right') as RunSpec
  const corner = slotOn(cornerRun, 0, 0, 0, 'corner')

  it('would otherwise park the player in the back wall', () => {
    expect(
      isBlocked(standing(standingPose(corner.position, cornerRun)), PLAYER_RADIUS, colliders),
    ).toBe(true)
  })

  it('steps along the run until the spot is clear', () => {
    const pose = standingPose(corner.position, cornerRun, colliders)
    expect(isBlocked(standing(pose), PLAYER_RADIUS, colliders)).toBe(false)
  })

  it('still faces the tape after stepping aside', () => {
    const pose = standingPose(corner.position, cornerRun, colliders)
    const forward = [-Math.sin(pose.yaw), -Math.cos(pose.yaw)]
    const toTape = [corner.position[0] - pose.position[0], corner.position[2] - pose.position[2]]
    const length = Math.hypot(toTape[0] as number, toTape[1] as number)
    expect((forward[0] as number) * ((toTape[0] as number) / length)).toBeGreaterThan(0)
  })

  it('leaves no tape or genre stop inside the geometry', () => {
    const spots = [...buildLocations(packed).values(), ...genreStops(packed).values()]
    const stuck = spots.filter((spot) => isBlocked(standing(spot.pose), PLAYER_RADIUS, colliders))
    expect(stuck.map((spot) => `${spot.bay} ${spot.itemId}`)).toEqual([])
  })
})
