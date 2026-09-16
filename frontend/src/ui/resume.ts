import { releaseLock, requestLock } from '../player/pointerLock'
import { useScene } from '../shell/sceneState'

export function holdScene() {
  releaseLock()
}

export function resumeScene() {
  const scene = useScene.getState()
  scene.setPaused(false)
  if (scene.mode === 'free') {
    void requestLock(scene.canvas)
  }
}
