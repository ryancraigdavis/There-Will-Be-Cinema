import { PerformanceMonitor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import type { AtlasIndex, Catalog, SiteInfo } from '../catalog/types'
import { Lobby } from '../lobby/Lobby'
import { BenchDriver } from '../perf/BenchDriver'
import { BENCH } from '../perf/perf'
import { PlayerRig } from '../player/PlayerRig'
import { sceneColliders } from '../scene/colliders'
import { Decor } from '../scene/Decor'
import { Lights } from '../theme/Lights'
import { Banners } from './Banners'
import { BoxDetail } from './BoxDetail'
import { Dividers } from './Dividers'
import type { StorePlan } from './layout'
import { dprAfter, type Quality, qualityFor } from './quality'
import { Room } from './Room'
import { ShelfBoxes } from './ShelfInstances'
import { Shelving } from './Shelving'
import { ShelfSigns } from './Signs'
import { StoreFixtures } from './StoreFixtures'
import { TapeLod } from './TapeLod'
import { TapePicker } from './TapePicker'
import { type RunBatch, runBatches } from './tapeBatches'
import { ShaderWarmup, TextureUploads, WarmAtlases } from './Warmup'

interface Props {
  catalog: Catalog | null
  plan: StorePlan | null
  site: SiteInfo | null
  atlasIndex: AtlasIndex | null
  atlasSettled: boolean
  active: boolean
}

function useQuality(): Quality {
  const gl = useThree((state) => state.gl)
  return useMemo(
    () =>
      qualityFor({
        coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
        maxTextureSize: gl.capabilities.maxTextureSize,
      }),
    [gl],
  )
}

function AdaptiveResolution({ quality }: { quality: Quality }) {
  const setDpr = useThree((state) => state.setDpr)
  return (
    <PerformanceMonitor
      flipflops={3}
      onDecline={() => setDpr(dprAfter(quality, true))}
      onIncline={() => setDpr(dprAfter(quality, false))}
      onFallback={() => setDpr(dprAfter(quality, true))}
    />
  )
}

interface TapesProps {
  catalog: Catalog
  plan: StorePlan
  index: AtlasIndex | null
  batches: RunBatch[]
}

function Tapes({ catalog, plan, index, batches }: TapesProps) {
  return (
    <>
      {batches.map((batch) => (
        <ShelfBoxes key={batch.key} batch={batch} catalog={catalog} index={index} />
      ))}
      <TapePicker sections={plan.sections} batches={batches} catalog={catalog} />
    </>
  )
}

export function StoreScene({ catalog, plan, site, atlasIndex, atlasSettled, active }: Props) {
  const quality = useQuality()
  const colliders = useMemo(() => sceneColliders(plan), [plan])
  const batches = useMemo(() => runBatches(plan?.sections ?? [], atlasIndex), [plan, atlasIndex])

  return (
    <>
      <Lights />
      <Room />
      {plan && <Shelving plan={plan} />}
      {plan && <Dividers dividers={plan.dividers} />}
      <Suspense fallback={null}>
        <Lobby />
        <Decor />
        {plan && <Banners banners={plan.banners} />}
        <StoreFixtures site={site} />
        {plan && <ShelfSigns signs={plan.signs} banners={plan.banners} />}
      </Suspense>
      {catalog && plan && atlasSettled && (
        <Tapes catalog={catalog} plan={plan} index={atlasIndex} batches={batches} />
      )}
      <TapeLod index={atlasIndex} quality={quality} />
      <AdaptiveResolution quality={quality} />
      <Suspense fallback={null}>
        {catalog && <BoxDetail catalog={catalog} site={site} colliders={colliders} />}
      </Suspense>
      <PlayerRig colliders={colliders} active={active} />
      <TextureUploads />
      <WarmAtlases index={atlasIndex} maxSize={quality.maxAtlasSize} />
      <ShaderWarmup ready={plan !== null && atlasIndex !== null} />
      {BENCH && <BenchDriver plan={plan} />}
    </>
  )
}
