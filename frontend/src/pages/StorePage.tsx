import '../ui/store.css'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
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
import { useWarmup } from '../shell/warmup'
import { buildStorePlan } from '../store/layout'
import { StoreScene } from '../store/StoreScene'
import { Guide } from '../ui/Guide'
import { Hud } from '../ui/Hud'
import { IntroOverlay, PauseOverlay } from '../ui/Overlays'
import { Sheets } from '../ui/Sheets'
import { TouchControls } from '../ui/TouchControls'
import { preloadGlyphs } from '../ui3d/glyphs'

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

function useTapeLink(ready: boolean, known: (id: string) => boolean) {
  const [params] = useSearchParams()
  const tape = params.get('tape')

  useEffect(() => {
    const scene = useScene.getState()
    if (!ready || !tape || !known(tape) || scene.mode !== 'intro') {
      return
    }
    scene.dispatch('enter')
    scene.dispatch('walk')
  }, [ready, tape, known])

  useEffect(
    () =>
      useScene.subscribe((state) => {
        if (tape && state.mode === 'free' && !state.selected && known(tape)) {
          useScene.getState().select(tape)
        }
      }),
    [tape, known],
  )
}

export function StorePage({ active }: { active: boolean }) {
  const catalog = readyValue(useCatalog())
  const site = readyValue(useSite())
  const atlasIndex = readyValue(useAtlasIndex())
  const collectionsResource = useCollections()
  const collections =
    collectionsResource.status === 'loading' ? null : (readyValue(collectionsResource) ?? [])
  const plan = useMemo(
    () => (catalog && collections ? buildStorePlan(catalog.items, collections) : null),
    [catalog, collections],
  )
  const webgl = useMemo(supportsWebGL2, [])
  const known = useMemo(() => (id: string) => catalog?.byId.has(id) ?? false, [catalog])
  useTapeLink(catalog !== null, known)

  useEffect(() => {
    void preloadGlyphs().then(() => useWarmup.getState().mark({ glyphs: true }))
  }, [])

  useEffect(() => {
    const publish = (state: ReturnType<typeof useScene.getState>) => {
      window.__scene = {
        mode: state.mode,
        focus: state.focus,
        selected: state.selected,
        hoverLabel: state.hoverLabel,
        locked: state.locked,
        paused: state.paused,
        guide: state.guide,
        sheet: state.sheet,
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
      scene.setGuide(false)
      scene.setSheet(null)
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
              plan={plan}
              site={site}
              atlasIndex={atlasIndex}
              active={active}
            />
          </SceneShell>
        </div>
      )}
      <Hud site={site} />
      <Guide catalog={catalog} plan={plan} active={active} />
      <Sheets active={active} />
      <IntroOverlay catalog={catalog} site={site} webgl={webgl} />
      <TouchControls />
      <PauseOverlay />
    </div>
  )
}
