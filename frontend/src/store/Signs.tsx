import { useMemo } from 'react'
import { TextBatch } from '../ui3d/TextBatch'
import type { Sign } from './geometry'
import type { Banner } from './layout'
import { storeTextSpecs } from './signText'

export function ShelfSigns({ signs, banners }: { signs: Sign[]; banners: Banner[] }) {
  const specs = useMemo(() => storeTextSpecs(signs, banners), [signs, banners])
  return <TextBatch specs={specs} name="store-text" />
}
