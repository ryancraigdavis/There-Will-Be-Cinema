import { LIGHT_RIG } from './lightRig'

export function Lights() {
  const { hemisphere, ambient, directional, points } = LIGHT_RIG
  return (
    <>
      <hemisphereLight args={[hemisphere.sky, hemisphere.ground, hemisphere.intensity]} />
      <ambientLight intensity={ambient.intensity} color={ambient.color} />
      <directionalLight
        position={[...directional.position]}
        intensity={directional.intensity}
        color={directional.color}
      />
      {points.map((light) => (
        <pointLight
          key={light.position.join(',')}
          position={[...light.position]}
          intensity={light.intensity}
          distance={light.distance}
          decay={light.decay}
          color={light.color}
        />
      ))}
    </>
  )
}
