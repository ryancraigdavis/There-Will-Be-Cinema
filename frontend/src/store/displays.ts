import { titleCollator } from '../catalog/collate'
import type { CatalogItem, Collection } from '../catalog/types'
import { SIGN_SIZE } from './constants'
import { fillRows, rowSlots, runSign, type ShelfSection, sectionsFrom } from './fill'
import type { Sign } from './geometry'
import {
  endcapSpecs,
  NEW_RELEASES_SPEC,
  type RunKind,
  type RunSpec,
  slotCapacity,
  TV_SPEC,
} from './runs'

export const NEW_RELEASE_COUNT = slotCapacity(NEW_RELEASES_SPEC)
export const ENDCAP_COUNT = endcapSpecs().length
export const ENDCAP_MIN_ITEMS = 4

const SIGN_SIZES: Record<RunKind, number> = {
  genre: SIGN_SIZE.section,
  'new-releases': SIGN_SIZE.wall,
  tv: SIGN_SIZE.wall,
  endcap: SIGN_SIZE.endcap,
}

export interface DisplayPlan {
  runs: RunSpec[]
  sections: ShelfSection[]
  signs: Sign[]
  overflow: string[]
}

const byTitle = (a: CatalogItem, b: CatalogItem) =>
  titleCollator.compare(a.sortTitle, b.sortTitle) || a.id.localeCompare(b.id)

export function newestMovies(items: readonly CatalogItem[], count: number): string[] {
  return items
    .filter((item) => item.type === 'Movie')
    .sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? '') || byTitle(a, b))
    .slice(0, count)
    .map((item) => item.id)
}

export function seriesByTitle(items: readonly CatalogItem[]): string[] {
  return items
    .filter((item) => item.type === 'Series')
    .sort(byTitle)
    .map((item) => item.id)
}

export function endcapCollections(
  collections: readonly Collection[],
  known: ReadonlySet<string>,
  count = ENDCAP_COUNT,
): Collection[] {
  return collections
    .map((collection) => ({
      ...collection,
      itemIds: collection.itemIds.filter((id) => known.has(id)),
    }))
    .filter((collection) => collection.itemIds.length >= ENDCAP_MIN_ITEMS)
    .sort((a, b) => b.itemIds.length - a.itemIds.length || titleCollator.compare(a.name, b.name))
    .slice(0, count)
}

function display(run: RunSpec, label: string, itemIds: readonly string[]): DisplayPlan {
  const { placements, overflow } = fillRows([{ label, itemIds }], rowSlots([run]))
  return {
    runs: [run],
    sections: sectionsFrom(placements),
    signs: [runSign(run, label, SIGN_SIZES[run.kind])],
    overflow,
  }
}

function merge(plans: readonly DisplayPlan[]): DisplayPlan {
  return {
    runs: plans.flatMap((plan) => plan.runs),
    sections: plans.flatMap((plan) => plan.sections),
    signs: plans.flatMap((plan) => plan.signs),
    overflow: plans.flatMap((plan) => plan.overflow),
  }
}

export function buildDisplays(
  items: readonly CatalogItem[],
  collections: readonly Collection[],
): DisplayPlan {
  const known = new Set(items.map((item) => item.id))
  const specs = endcapSpecs()
  const endcaps = endcapCollections(collections, known).map((collection, i) => {
    const spec = specs[i] as RunSpec
    return display(spec, collection.name, collection.itemIds.slice(0, slotCapacity(spec)))
  })
  return merge([
    display(NEW_RELEASES_SPEC, 'New Releases', newestMovies(items, NEW_RELEASE_COUNT)),
    display(TV_SPEC, 'TV on DVD', seriesByTitle(items)),
    ...endcaps,
  ])
}
