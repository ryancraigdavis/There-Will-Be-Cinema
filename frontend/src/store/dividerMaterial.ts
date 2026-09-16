import { MeshBasicMaterial, type Texture, Vector2 } from 'three'

const VERTEX_HEAD = /* glsl */ `#include <common>
attribute vec2 aCell;
uniform vec2 uCellSize;
varying vec2 vLetterUv;
`

const VERTEX_BODY = /* glsl */ `#include <uv_vertex>
vLetterUv = aCell + uv * uCellSize;
`

const FRAGMENT_HEAD = /* glsl */ `#include <common>
uniform sampler2D uLetters;
varying vec2 vLetterUv;
`

const FRAGMENT_COLOR = /* glsl */ `#include <color_fragment>
diffuseColor.rgb = texture2D(uLetters, vLetterUv).rgb;
`

export interface DividerUniforms {
  uLetters: { value: Texture }
  uCellSize: { value: Vector2 }
}

export function createDividerMaterial(letters: Texture, cell: [number, number]) {
  const uniforms: DividerUniforms = {
    uLetters: { value: letters },
    uCellSize: { value: new Vector2(cell[0], cell[1]) },
  }
  const material = new MeshBasicMaterial({ color: '#ffffff' })
  material.customProgramCacheKey = () => 'twbc-letter-tab'
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', VERTEX_HEAD)
      .replace('#include <uv_vertex>', VERTEX_BODY)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', FRAGMENT_HEAD)
      .replace('#include <color_fragment>', FRAGMENT_COLOR)
  }
  return { material, uniforms }
}
