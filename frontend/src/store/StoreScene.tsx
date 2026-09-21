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
import { Room } from './Room'
import { ShelfBoxes, type ShelfGroup } from './ShelfInstances'
import { Shelving } from './Shelving'
import { ShelfSigns } from './Signs'
import { StoreFixtures } from './StoreFixtures'
import { ShaderWarmup, TextureUploads, WarmAtlases } from './Warmup'

const PHONE_ATLAS_SIZE = 2048
const DESKTOP_ATLAS_SIZE = 4096

interface Props {
  catalog: Catalog | null
  plan: StorePlan | null
  site: SiteInfo | null
  atlasIndex: AtlasIndex | null
  active: boolean
}

function useMaxAtlasSize(): number {
  const gl = useThree((state) => state.gl)
  return useMemo(() => {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
    const limit = coarse ? PHONE_ATLAS_SIZE : DESKTOP_ATLAS_SIZE
    return Math.min(gl.capabilities.maxTextureSize, limit)
  }, [gl])
}

export function StoreScene({ catalog, plan, site, atlasIndex, active }: Props) {
  const maxAtlasSize = useMaxAtlasSize()
  const colliders = useMemo(() => sceneColliders(plan), [plan])
  const groups = useMemo<ShelfGroup[]>(
    () => (plan?.sections ?? []).map(({ id, slots, center }) => ({ id, slots, center })),
    [plan],
  )

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
        {plan && <ShelfSigns signs={plan.signs} />}
      </Suspense>
      {catalog &&
        groups.map((group) => (
          <ShelfBoxes
            key={group.id}
            group={group}
            catalog={catalog}
            index={atlasIndex}
            maxAtlasSize={maxAtlasSize}
          />
        ))}
      <Suspense fallback={null}>{catalog && <BoxDetail catalog={catalog} site={site} />}</Suspense>
      <PlayerRig colliders={colliders} active={active} />
      <TextureUploads />
      <WarmAtlases index={atlasIndex} maxSize={maxAtlasSize} />
      <ShaderWarmup ready={plan !== null && atlasIndex !== null} />
      {BENCH && <BenchDriver plan={plan} />}
    </>
  )
}
