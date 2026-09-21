import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { embyHomeUrl } from '../api'
import type { SiteInfo } from '../catalog/types'
import { KIOSK } from '../lobby/anchors'
import { type Glow, Hotspot } from '../lobby/Hotspot'
import { releaseLock } from '../player/pointerLock'
import { useScene } from '../shell/sceneState'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import { kioskTexture } from '../theme/textures'
import { alongOf, NEW_RELEASES_SPEC } from './runs'

const SIGN_ALONG = NEW_RELEASES_SPEC.length / 2
const [SIGN_AX, SIGN_AZ] = alongOf(NEW_RELEASES_SPEC.normal)
const SIGN = {
  x: NEW_RELEASES_SPEC.origin[0] + SIGN_AX * SIGN_ALONG + NEW_RELEASES_SPEC.normal[0] * 0.04,
  y: 2.62,
  z: NEW_RELEASES_SPEC.origin[1] + SIGN_AZ * SIGN_ALONG + NEW_RELEASES_SPEC.normal[1] * 0.04,
  yaw: Math.atan2(NEW_RELEASES_SPEC.normal[0], NEW_RELEASES_SPEC.normal[1]),
  width: NEW_RELEASES_SPEC.length - 0.4,
}

const KIOSK_GLOW: Glow = {
  center: [KIOSK.x, 0.75, KIOSK.z],
  size: [0.66, 1.4, 0.6],
  yaw: KIOSK.yaw,
}
const SIGN_GLOW: Glow = {
  center: [SIGN.x, SIGN.y, SIGN.z],
  size: [SIGN.width + 0.1, 0.66, 0.14],
  yaw: SIGN.yaw,
}

function Kiosk() {
  const screen = useMemo(() => kioskTexture(), [])
  return (
    <group position={[KIOSK.x, 0, KIOSK.z]} rotation={[0, KIOSK.yaw, 0]}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.5, 0.9, 0.4]} />
        <meshLambertMaterial color={PALETTE.rust} />
      </mesh>
      <mesh position={[0, 0.62, 0.201]}>
        <boxGeometry args={[0.5, 0.05, 0.004]} />
        <meshLambertMaterial color={PALETTE.gold} emissive={PALETTE.gold} emissiveIntensity={0.3} />
      </mesh>
      <Text
        font={FONTS.display}
        position={[0, 0.4, 0.204]}
        fontSize={0.075}
        letterSpacing={0.14}
        color={PALETTE.gold}
      >
        CATALOG
      </Text>
      <group position={[0, 1.02, 0.02]} rotation={[-0.55, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.48, 0.36, 0.06]} />
          <meshLambertMaterial color={PALETTE.ink} />
        </mesh>
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[0.42, 0.3]} />
          <meshBasicMaterial map={screen} />
        </mesh>
      </group>
    </group>
  )
}

function NewReleasesSign() {
  return (
    <group position={[SIGN.x, SIGN.y, SIGN.z]} rotation={[0, SIGN.yaw, 0]}>
      <mesh>
        <boxGeometry args={[SIGN.width, 0.56, 0.05]} />
        <meshLambertMaterial color={PALETTE.rust} />
      </mesh>
      <mesh position={[0, 0, -0.004]}>
        <boxGeometry args={[SIGN.width + 0.06, 0.62, 0.04]} />
        <meshBasicMaterial color={PALETTE.gold} />
      </mesh>
      <Text
        font={FONTS.display}
        position={[0, 0.06, 0.03]}
        fontSize={0.26}
        letterSpacing={0.12}
        color={PALETTE.gold}
      >
        NEW RELEASES
      </Text>
      <Text
        font={FONTS.display}
        position={[0, -0.19, 0.03]}
        fontSize={0.085}
        letterSpacing={0.2}
        color={PALETTE.cream}
      >
        WATCH THEM ON EMBY
      </Text>
    </group>
  )
}

export function StoreFixtures({ site }: { site: SiteInfo | null }) {
  const mode = useScene((state) => state.mode)
  const paused = useScene((state) => state.paused)
  const navigate = useNavigate()
  const active = !paused && (mode === 'counter' || mode === 'free')

  const openCatalog = () => {
    releaseLock()
    navigate('/search')
  }
  const openEmby = () => {
    if (site) {
      window.open(embyHomeUrl(site), '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
      <Hotspot label="Search the catalog" glow={KIOSK_GLOW} active={active} onSelect={openCatalog}>
        <Kiosk />
      </Hotspot>
      <Hotspot
        label="New releases · Watch on Emby"
        glow={SIGN_GLOW}
        active={active}
        onSelect={openEmby}
      >
        <NewReleasesSign />
      </Hotspot>
    </>
  )
}
