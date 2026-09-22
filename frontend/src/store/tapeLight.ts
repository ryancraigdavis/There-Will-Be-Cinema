import type { Vec3 } from '../scene/math'
import type { LightRig, PointLightSpec } from '../theme/lightRig'

export type Rgb = [number, number, number]

function channel(hex: string, at: number): number {
  const c = Number.parseInt(hex.slice(at, at + 2), 16) / 255
  return c < 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function linearRgb(hex: string): Rgb {
  return [channel(hex, 1), channel(hex, 3), channel(hex, 5)]
}

const scale = (rgb: Rgb, k: number): Rgb => [rgb[0] * k, rgb[1] * k, rgb[2] * k]
const add = (a: Rgb, b: Rgb): Rgb => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const length = (v: Vec3) => Math.hypot(v[0], v[1], v[2])
const unit = (v: Vec3): Vec3 => scale(v as Rgb, 1 / Math.max(length(v), 1e-9)) as Vec3

export function coverNormal(yaw: number): Vec3 {
  return [Math.cos(yaw), 0, -Math.sin(yaw)]
}

export function distanceAttenuation(distance: number, cutoff: number, decay: number): number {
  const falloff = 1 / Math.max(distance ** decay, 0.01)
  const window = cutoff > 0 ? Math.max(0, 1 - (distance / cutoff) ** 4) ** 2 : 1
  return falloff * window
}

function pointIrradiance(light: PointLightSpec, position: Vec3, normal: Vec3): Rgb {
  const toLight: Vec3 = [
    light.position[0] - position[0],
    light.position[1] - position[1],
    light.position[2] - position[2],
  ]
  const distance = length(toLight)
  const dotNL = Math.max(0, dot(normal, unit(toLight)))
  return scale(
    linearRgb(light.color),
    light.intensity * dotNL * distanceAttenuation(distance, light.distance, light.decay),
  )
}

export function irradiance(position: Vec3, normal: Vec3, rig: LightRig): Rgb {
  const { hemisphere, ambient, directional, points } = rig
  const skyWeight = 0.5 * normal[1] + 0.5
  const hemi = add(
    scale(linearRgb(hemisphere.ground), hemisphere.intensity * (1 - skyWeight)),
    scale(linearRgb(hemisphere.sky), hemisphere.intensity * skyWeight),
  )
  const sun = scale(
    linearRgb(directional.color),
    directional.intensity * Math.max(0, dot(normal, unit(directional.position))),
  )
  return points
    .map((light) => pointIrradiance(light, position, normal))
    .reduce(add, add(add(scale(linearRgb(ambient.color), ambient.intensity), hemi), sun))
}

export function bakeLight(position: Vec3, normal: Vec3, rig: LightRig): Rgb {
  return scale(irradiance(position, normal, rig), 1 / Math.PI)
}
