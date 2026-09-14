import '../ui/store.css'
import { useEffect, useMemo } from 'react'
import {
  readyValue,
  useAtlasIndex,
  useCatalog,
  useCollections,
  useSite,
} from '../catalog/resources'
import { releaseLock } from '../player/pointerLock'
import { SceneShell } from '../shell/SceneShell'
import { useScene } from '../shell/sceneState'
import { StoreScene } from '../store/StoreScene'
import { Hud } from '../ui/Hud'
import { IntroOverlay, PauseOverlay } from '../ui/Overlays'
import { TouchControls } from '../ui/TouchControls'

declare global {
  interface Window {
    __scene?: Record<string, unknown>
  }
}

function supportsWebGL2(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null
  } catch {
    return false
  }
}

export function StorePage({ active }: { active: boolean }) {
  const catalog = readyValue(useCatalog())
  const site = readyValue(useSite())
  const atlasIndex = readyValue(useAtlasIndex())
  const collectionsResource = useCollections()
  const collections =
    collectionsResource.status === 'loading' ? null : (readyValue(collectionsResource) ?? [])
  const webgl = useMemo(supportsWebGL2, [])

  useEffect(() => {
    const publish = (state: ReturnType<typeof useScene.getState>) => {
      window.__scene = {
        mode: state.mode,
        focus: state.focus,
        selected: state.selected,
        hoverLabel: state.hoverLabel,
        locked: state.locked,
        paused: state.paused,
      }
    }
    publish(useScene.getState())
    return useScene.subscribe(publish)
  }, [])

  useEffect(() => {
    if (!active) {
      releaseLock()
      const scene = useScene.getState()
      scene.setHover(null)
      scene.setPaused(scene.mode === 'free')
    }
  }, [active])

  return (
    <div className="store" hidden={!active}>
      {webgl && (
        <div className="store__canvas">
          <SceneShell active={active}>
            <StoreScene
              catalog={catalog}
              collections={collections}
              site={site}
              atlasIndex={atlasIndex}
              active={active}
            />
          </SceneShell>
        </div>
      )}
      <Hud site={site} />
      <IntroOverlay catalog={catalog} site={site} webgl={webgl} />
      <TouchControls />
      <PauseOverlay />
    </div>
  )
}
