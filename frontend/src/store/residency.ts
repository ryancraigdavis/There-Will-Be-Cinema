import type { AABB } from '../player/collision'
import { distanceToBounds } from './tapeBatches'

export interface Demand {
  sheet: number
  distance: number
}

export interface Residency {
  resident: readonly number[]
  loading: number | null
}

export interface Budget {
  fullSheets: number
  fullDistance: number
  hold: number
}

export interface Plan {
  load: number | null
  cancel: number | null
  evict: number[]
  release: number[]
}

export function nearestPerSheet(
  batches: readonly { atlas: number; bounds: AABB }[],
  x: number,
  z: number,
): Demand[] {
  const nearest = new Map<number, number>()
  for (const { atlas, bounds } of batches) {
    const distance = distanceToBounds(bounds, x, z)
    nearest.set(atlas, Math.min(nearest.get(atlas) ?? Number.POSITIVE_INFINITY, distance))
  }
  return [...nearest]
    .filter(([sheet]) => sheet >= 0)
    .map(([sheet, distance]) => ({ sheet, distance }))
    .sort((a, b) => a.distance - b.distance)
}

function ranked(demands: readonly Demand[], state: Residency, budget: Budget): number[] {
  const held = new Set([...state.resident, ...(state.loading === null ? [] : [state.loading])])
  return demands
    .filter(({ sheet, distance }) =>
      held.has(sheet)
        ? distance <= budget.fullDistance + budget.hold
        : distance <= budget.fullDistance,
    )
    .map(({ sheet }) => sheet)
}

export function planFull(
  demands: readonly Demand[],
  state: Residency,
  settled: boolean,
  budget: Budget,
): Plan {
  const wanted = ranked(demands, state, budget)
  const target = new Set(wanted.slice(0, budget.fullSheets))
  const inRange = new Set(wanted)
  const loading = state.loading
  const keepLoading = loading !== null && target.has(loading)
  const next = wanted.find((sheet) => !state.resident.includes(sheet) && sheet !== loading)
  return {
    load: settled && loading === null && next !== undefined && target.has(next) ? next : null,
    cancel: loading !== null && !keepLoading ? loading : null,
    evict: state.resident.filter((sheet) => inRange.has(sheet) && !target.has(sheet)),
    release: state.resident.filter((sheet) => !inRange.has(sheet)),
  }
}
