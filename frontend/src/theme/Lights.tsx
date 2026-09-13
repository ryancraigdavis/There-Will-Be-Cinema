export function Lights() {
  return (
    <>
      <hemisphereLight args={['#fff1d6', '#3a1a10', 1.6]} />
      <ambientLight intensity={0.35} color="#ffe2b8" />
      <directionalLight position={[3, 7, 4]} intensity={0.9} color="#fff4e0" />
      <pointLight
        position={[3.4, 2.6, 3.2]}
        intensity={7}
        distance={8}
        decay={1.5}
        color="#ffd9a0"
      />
      <pointLight position={[0, 2.7, -4]} intensity={6} distance={10} decay={1.5} color="#fff0d8" />
    </>
  )
}
