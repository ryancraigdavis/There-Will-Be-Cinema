import { Suspense, useMemo } from 'react'
import type { AtlasIndex, Catalog, SiteInfo } from '../catalog/types'
import { Lobby } from '../lobby/Lobby'
import { PlayerRig } from '../player/PlayerRig'
import { sceneColliders } from '../scene/colliders'
import { Lights } from '../theme/Lights'
import { BoxDetail } from './BoxDetail'
import { RENDERED_AISLES } from './constants'
import { Gondola, SectionSign } from './Gondola'
import { buildStorePlan } from './layout'
import { Room } from './Room'
import { SectionBoxes } from './ShelfInstances'

interface Props {
  catalog: Catalog | null
  site: SiteInfo | null
  atlasIndex: AtlasIndex | null
  active: boolean
}

export function StoreScene({ catalog, site, atlasIndex, active }: Props) {
  const plan = useMemo(() => (catalog ? buildStorePlan(catalog.items) : null), [catalog])
  const colliders = useMemo(() => sceneColliders(plan), [plan])
  const sections = useMemo(
    () => plan?.sections.filter((section) => RENDERED_AISLES.includes(section.aisle)) ?? [],
    [plan],
  )

  return (
    <>
      <Lights />
      <Room />
      {plan?.gondolas.map((frame) => (
        <Gondola key={frame.index} frame={frame} />
      ))}
      <Suspense fallback={null}>
        <Lobby site={site} />
        {sections.map((section) => (
          <SectionSign key={section.id} section={section} />
        ))}
      </Suspense>
      {catalog &&
        sections.map((section) => (
          <SectionBoxes key={section.id} section={section} catalog={catalog} index={atlasIndex} />
        ))}
      <Suspense fallback={null}>{catalog && <BoxDetail catalog={catalog} site={site} />}</Suspense>
      <PlayerRig colliders={colliders} active={active} />
    </>
  )
}
