import { type AABB, isBlocked } from '../player/collision'
import { EYE_HEIGHT, PLAYER_RADIUS } from '../player/locomotion'
import { sceneColliders } from '../scene/colliders'
import { type Pose, poseLookingAt, type Vec3 } from '../scene/math'
import type { ShelfSection } from './fill'
import type { Slot } from './geometry'
import type { StorePlan } from './layout'
import { alongOf, type RunKind, type RunSpec, WALKWAYS } from './runs'

export const STAND_BACK = 1
const ELBOW_ROOM = PLAYER_RADIUS + 0.06
const SLIDES = [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2]

export interface StoreLocation {
  itemId: string
  bay: string
  aisle: string
  pose: Pose
}

const AISLE_BY_RUN = new Map(
  WALKWAYS.flatMap((walkway) => walkway.runIds.map((id) => [id, walkway.label] as const)),
)

const KIND_AISLE: Record<RunKind, string> = {
  genre: 'Back wall',
  'new-releases': 'New Releases',
  tv: 'TV on DVD',
  endcap: 'Aisle end',
}

const HOME_LAST: readonly RunKind[] = ['endcap', 'new-releases', 'tv', 'genre']

export function aisleOf(run: RunSpec): string {
  return AISLE_BY_RUN.get(run.id) ?? KIND_AISLE[run.kind]
}

function standAt(target: Vec3, run: RunSpec, slide: number): Vec3 {
  const [ax, az] = alongOf(run.normal)
  return [
    target[0] + run.normal[0] * STAND_BACK + ax * slide,
    EYE_HEIGHT,
    target[2] + run.normal[1] * STAND_BACK + az * slide,
  ]
}

export function standingPose(target: Vec3, run: RunSpec, colliders: readonly AABB[] = []): Pose {
  const spots = SLIDES.map((slide) => standAt(target, run, slide))
  const clear = spots.find((spot) => !isBlocked({ x: spot[0], z: spot[2] }, ELBOW_ROOM, colliders))
  return poseLookingAt(clear ?? (spots[0] as Vec3), target)
}

interface Store {
  bays: Map<string, string>
  colliders: readonly AABB[]
}

function storeOf(plan: StorePlan): Store {
  return {
    bays: new Map(plan.signs.map((sign) => [sign.id, sign.label] as const)),
    colliders: sceneColliders(plan),
  }
}

function locationOf(section: ShelfSection, slot: Slot, store: Store): StoreLocation {
  return {
    itemId: slot.itemId,
    bay: store.bays.get(`sign:${section.id}`) ?? store.bays.get(`sign:${section.run.id}`) ?? '',
    aisle: aisleOf(section.run),
    pose: standingPose(slot.position, section.run, store.colliders),
  }
}

function homeFirst(sections: readonly ShelfSection[]): ShelfSection[] {
  return [...sections].sort((a, b) => HOME_LAST.indexOf(a.run.kind) - HOME_LAST.indexOf(b.run.kind))
}

export function buildLocations(plan: StorePlan): Map<string, StoreLocation> {
  const store = storeOf(plan)
  return new Map(
    homeFirst(plan.sections).flatMap((section) =>
      section.slots.map((slot) => [slot.itemId, locationOf(section, slot, store)] as const),
    ),
  )
}

export function genreStops(plan: StorePlan): Map<string, StoreLocation> {
  const store = storeOf(plan)
  const starts = plan.sections.flatMap((section) =>
    section.labels.flatMap((label) => {
      const slot = section.slots[0]
      return slot ? [[label, locationOf(section, slot, store)] as const] : []
    }),
  )
  return new Map([...starts].reverse())
}
