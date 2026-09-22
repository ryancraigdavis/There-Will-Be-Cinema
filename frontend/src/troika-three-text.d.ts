declare module 'troika-three-text' {
  import type { Material, Mesh } from 'three'

  export function preloadFont(
    options: { font?: string; characters: string | string[]; sdfGlyphSize?: number },
    callback: () => void,
  ): void

  export class Text extends Mesh {
    text: string
    font: string | null
    fontSize: number
    letterSpacing: number
    lineHeight: number | 'normal'
    maxWidth: number
    textAlign: 'left' | 'right' | 'center' | 'justify'
    anchorX: number | 'left' | 'center' | 'right'
    anchorY: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom'
    color: string | number | null
    material: Material
    sync(callback?: () => void): void
    dispose(): void
  }

  export class BatchedText extends Text {
    addText(text: Text): void
    removeText(text: Text): void
  }
}
