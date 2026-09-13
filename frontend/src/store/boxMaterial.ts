import { MeshLambertMaterial, type Texture, Vector2 } from 'three'
import { BOX } from './constants'

const VERTEX_HEAD = /* glsl */ `#include <common>
attribute vec3 aCell;
attribute vec3 aSpine;
uniform vec2 uCellSize;
uniform float uSpineRatio;
uniform float uHover;
varying vec2 vAtlasUv;
varying float vTextured;
varying vec3 vSpine;
varying float vHover;
`

const VERTEX_BODY = /* glsl */ `#include <uv_vertex>
float isCover = step(0.5, normal.x);
float isSpine = step(0.5, normal.z);
vec2 spineUv = vec2(0.5 + (uv.x - 0.5) * uSpineRatio, uv.y);
vec2 faceUv = mix(spineUv, uv, isCover);
vAtlasUv = aCell.xy + (faceUv * 0.98 + 0.01) * uCellSize;
vTextured = max(isCover, isSpine) * aCell.z;
vSpine = aSpine;
vHover = 1.0 - step(0.5, abs(float(gl_InstanceID) - uHover));
`

const FRAGMENT_HEAD = /* glsl */ `#include <common>
uniform sampler2D uAtlas;
uniform float uHasAtlas;
varying vec2 vAtlasUv;
varying float vTextured;
varying vec3 vSpine;
varying float vHover;
`

const FRAGMENT_COLOR = /* glsl */ `#include <color_fragment>
vec3 atlasColor = texture2D(uAtlas, vAtlasUv).rgb;
diffuseColor.rgb = mix(vSpine, atlasColor, vTextured * uHasAtlas);
diffuseColor.rgb *= 1.0 + vHover * 0.3;
`

const FRAGMENT_EMISSIVE = /* glsl */ `#include <emissivemap_fragment>
totalEmissiveRadiance += vHover * vec3(0.18, 0.12, 0.02);
`

export interface BoxUniforms {
  uAtlas: { value: Texture | null }
  uHasAtlas: { value: number }
  uCellSize: { value: Vector2 }
  uSpineRatio: { value: number }
  uHover: { value: number }
}

export function createBoxMaterial(cell: [number, number]): {
  material: MeshLambertMaterial
  uniforms: BoxUniforms
} {
  const uniforms: BoxUniforms = {
    uAtlas: { value: null },
    uHasAtlas: { value: 0 },
    uCellSize: { value: new Vector2(cell[0], cell[1]) },
    uSpineRatio: { value: BOX.spine / BOX.cover },
    uHover: { value: -1 },
  }
  const material = new MeshLambertMaterial({ color: '#ffffff' })
  material.customProgramCacheKey = () => 'twbc-vhs-box'
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', VERTEX_HEAD)
      .replace('#include <uv_vertex>', VERTEX_BODY)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', FRAGMENT_HEAD)
      .replace('#include <color_fragment>', FRAGMENT_COLOR)
      .replace('#include <emissivemap_fragment>', FRAGMENT_EMISSIVE)
  }
  return { material, uniforms }
}
