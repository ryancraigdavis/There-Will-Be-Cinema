import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { InstancedMesh, type PerspectiveCamera, type Texture, Vector3 } from 'three'
import type { AtlasIndex } from '../catalog/types'
import { perf } from '../perf/perf'
import { warmLevel } from '../shell/warmup'
import { acquireTexture, atlasLevelUrl, releaseTexture } from './atlasTextures'
import {
  availableLevels,
  coverPixels,
  fullDistance,
  fullLevel,
  HOLD_FULL,
  LOD_INTERVAL_FRAMES,
  PICK_DISTANCE,
  STILL_METRES,
  usableLevels,
} from './lod'
import { type Budget, nearestPerSheet, planFull } from './residency'
import { bindAtlas, type TapeBatch, tapeBatches } from './tapeRegistry'

const FULL_SHEETS = 2
const noRaycast = () => undefined

interface Levels {
  warm: number | null
  full: number | null
}

interface Held {
  sheets: Map<number, Texture>
  loading: number | null
}

function useLevels(index: AtlasIndex | null, maxSize: number): Levels {
  return useMemo(() => {
    const levels = availableLevels(index)
    const warm = warmLevel(levels, maxSize)
    return { warm, full: fullLevel(usableLevels(levels, maxSize, warm), warm) }
  }, [index, maxSize])
}

function useWarmSheets(index: AtlasIndex | null, warm: number | null): Map<number, Texture> {
  const sheets = useMemo(() => new Map<number, Texture>(), [])
  useEffect(() => {
    if (!index || !warm) {
      return
    }
    const urls = Array.from({ length: index.count }, (_, i) => atlasLevelUrl(index, i, warm))
    urls.forEach((url, i) => {
      acquireTexture(url).then(
        (texture) => sheets.set(i, texture),
        () => undefined,
      )
    })
    return () => {
      sheets.clear()
      for (const url of urls) {
        releaseTexture(url)
      }
    }
  }, [index, warm, sheets])
  return sheets
}

function applyPicking(batch: TapeBatch, camera: PerspectiveCamera, scratch: Vector3) {
  const distance = camera.position.distanceTo(scratch.set(...batch.center))
  if (batch.mesh) {
    batch.mesh.raycast = distance <= PICK_DISTANCE ? InstancedMesh.prototype.raycast : noRaycast
  }
}

function bindAll(full: Map<number, Texture>, warm: Map<number, Texture>) {
  let changes = 0
  for (const batch of tapeBatches()) {
    const texture = full.get(batch.atlas) ?? warm.get(batch.atlas) ?? null
    changes += bindAtlas(batch, texture) ? 1 : 0
  }
  perf.count('lod.change', changes)
}

interface TickContext {
  index: AtlasIndex
  full: number
  held: Held
  budget: Budget
}

function budgetFor(index: AtlasIndex, levels: Levels, viewportPx: number, fov: number): Budget {
  const cellPx = coverPixels(index, levels.warm ?? levels.full ?? index.size)
  return {
    fullSheets: FULL_SHEETS,
    fullDistance: fullDistance(viewportPx, fov, cellPx),
    hold: HOLD_FULL,
  }
}

function upgradeTick(context: TickContext, camera: PerspectiveCamera, settled: boolean) {
  const { held, budget } = context
  const demands = nearestPerSheet([...tapeBatches()], camera.position.x, camera.position.z)
  const state = { resident: [...held.sheets.keys()], loading: held.loading }
  applyPlan(context, planFull(demands, state, settled, budget))
  perf.gauge('lod.full', held.sheets.size + (held.loading === null ? 0 : 1))
}

function applyPlan(context: TickContext, plan: ReturnType<typeof planFull>) {
  const { index, full, held } = context
  const url = (sheet: number) => atlasLevelUrl(index, sheet, full)
  for (const sheet of plan.evict) {
    held.sheets.delete(sheet)
    releaseTexture(url(sheet), { immediate: true })
  }
  for (const sheet of plan.release) {
    held.sheets.delete(sheet)
    releaseTexture(url(sheet))
  }
  if (plan.cancel !== null) {
    held.loading = null
    releaseTexture(url(plan.cancel))
  }
  if (plan.load !== null) {
    startLoad(context, plan.load)
  }
}

function startLoad({ index, full, held }: TickContext, sheet: number) {
  held.loading = sheet
  acquireTexture(atlasLevelUrl(index, sheet, full), 'upgrade').then(
    (texture) => {
      held.loading = held.loading === sheet ? null : held.loading
      held.sheets.set(sheet, texture)
    },
    () => {
      held.loading = held.loading === sheet ? null : held.loading
    },
  )
}

export function TapeLod({ index, maxSize }: { index: AtlasIndex | null; maxSize: number }) {
  const levels = useLevels(index, maxSize)
  const warm = useWarmSheets(index, levels.warm)
  const held = useRef<Held>({ sheets: new Map(), loading: null })
  const frame = useRef(0)
  const last = useRef(new Vector3(Number.POSITIVE_INFINITY, 0, 0))
  const scratch = useMemo(() => new Vector3(), [])
  const size = useThree((state) => state.size)
  const dpr = useThree((state) => state.viewport.dpr)

  useFrame(({ camera }) => {
    frame.current = (frame.current + 1) % LOD_INTERVAL_FRAMES
    if (frame.current !== 0) {
      return
    }
    const perspective = camera as PerspectiveCamera
    const settled = camera.position.distanceTo(last.current) < STILL_METRES
    last.current.copy(camera.position)
    for (const batch of tapeBatches()) {
      applyPicking(batch, perspective, scratch)
    }
    if (index && levels.full) {
      const budget = budgetFor(index, levels, size.height * dpr, perspective.fov)
      upgradeTick({ index, full: levels.full, held: held.current, budget }, perspective, settled)
    }
    bindAll(held.current.sheets, warm)
  })

  useEffect(() => {
    const current = held.current
    return () => {
      const full = levels.full
      if (index && full) {
        for (const sheet of current.sheets.keys()) {
          releaseTexture(atlasLevelUrl(index, sheet, full))
        }
      }
      current.sheets.clear()
      current.loading = null
    }
  }, [index, levels.full])

  return null
}
