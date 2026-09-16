import '../club/club.css'
import { type ReactNode, useEffect } from 'react'
import { type Sheet as SheetKind, useScene } from '../shell/sceneState'
import { holdScene, resumeScene } from './resume'

export function openSheet(kind: SheetKind) {
  useScene.getState().setSheet(kind)
  holdScene()
}

export function closeSheet() {
  useScene.getState().setSheet(null)
  resumeScene()
}

export function useSheetKeys(active: boolean) {
  useEffect(() => {
    if (!active) {
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' || !useScene.getState().sheet) {
        return
      }
      event.preventDefault()
      event.stopImmediatePropagation()
      closeSheet()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [active])
}

interface Props {
  title: string
  children: ReactNode
}

export function Sheet({ title, children }: Props) {
  return (
    <div className="sheet">
      <section className="sheet__panel" role="dialog" aria-modal="true" aria-label={title}>
        <header className="sheet__head">
          <h2 className="sheet__title">{title}</h2>
          <button type="button" className="chip" onClick={closeSheet}>
            Close · Esc
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
