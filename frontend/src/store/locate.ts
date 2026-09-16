import { EYE_HEIGHT } from '../player/locomotion'
import { type Pose, poseLookingAt, type Vec3 } from '../scene/math'
import type { ShelfSection } from './fill'
import type { Slot } from './geometry'
import type { StorePlan } from './layout'
import { type RunKind, type RunSpec, WALKWAYS } from './runs'

export const STAND_BACK = 1

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

export function standingPose(target: Vec3, run: RunSpec): Pose {
  const stand: Vec3 = [
    target[0] + run.normal[0] * STAND_BACK,
    EYE_HEIGHT,
    target[2] + run.normal[1] * STAND_BACK,
  ]
  return poseLookingAt(stand, target)
}

function locationOf(section: ShelfSection, slot: Slot, bays: Map<string, string>): StoreLocation {
  return {
    itemId: slot.itemId,
    bay: bays.get(`sign:${section.id}`) ?? bays.get(`sign:${section.run.id}`) ?? '',
    aisle: aisleOf(section.run),
    pose: standingPose(slot.position, section.run),
  }
}

function homeFirst(sections: readonly ShelfSection[]): ShelfSection[] {
  return [...sections].sort((a, b) => HOME_LAST.indexOf(a.run.kind) - HOME_LAST.indexOf(b.run.kind))
}

export function buildLocations(plan: StorePlan): Map<string, StoreLocation> {
  const bays = new Map(plan.signs.map((sign) => [sign.id, sign.label] as const))
  return new Map(
    homeFirst(plan.sections).flatMap((section) =>
      section.slots.map((slot) => [slot.itemId, locationOf(section, slot, bays)] as const),
    ),
  )
}

export function genreStops(plan: StorePlan): Map<string, StoreLocation> {
  const bays = new Map(plan.signs.map((sign) => [sign.id, sign.label] as const))
  const starts = plan.sections.flatMap((section) =>
    section.labels.flatMap((label) => {
      const slot = section.slots[0]
      return slot ? [[label, locationOf(section, slot, bays)] as const] : []
    }),
  )
  return new Map([...starts].reverse())
}
