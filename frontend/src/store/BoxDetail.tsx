import { Text } from '@react-three/drei'
import { type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  type Camera,
  type Group,
  type Material,
  type Mesh,
  MeshBasicMaterial,
  type Object3D,
  Raycaster,
  type Scene,
  type Texture,
  Vector3,
} from 'three'
import { embyItemUrl, posterUrl } from '../api'
import { type BadgeKind, badgesFor } from '../catalog/badges'
import { metaLine, truncate } from '../catalog/format'
import type { Catalog, CatalogItem, SiteInfo } from '../catalog/types'
import type { Vec3 } from '../scene/math'
import { useScene } from '../shell/sceneState'
import { FONTS } from '../theme/fonts'
import { PALETTE } from '../theme/palette'
import { Button3D } from '../ui3d/Button3D'
import { useTexture } from './atlasTextures'

const DISTANCE = 0.42
const MIN_DISTANCE = 0.18
const CLEARANCE = 0.08
const SCALE = 0.6
const OVERLAY_ORDER = 1000
const SETTLE_FRAMES = 90
const CARD = { x: 0.15, width: 0.38, height: 0.46, pad: 0.022 }
const TITLE_SIZE = 0.03
const TITLE_CHARS_PER_LINE = 24

const BADGE_COLORS: Record<BadgeKind, { fill: string; text: string }> = {
  '4k': { fill: PALETTE.gold, text: PALETTE.ink },
  dv: { fill: PALETTE.ink, text: PALETTE.gold },
  hdr: { fill: PALETTE.sunset, text: PALETTE.ink },
  atmos: { fill: PALETTE.cream, text: PALETTE.ink },
  dtsx: { fill: PALETTE.cream, text: PALETTE.ink },
  tv: { fill: PALETTE.rustBright, text: PALETTE.cream },
}

interface Placement {
  position: Vec3
  yaw: number
  distance: number
}

const stop = (event: ThreeEvent<MouseEvent | PointerEvent>) => event.stopPropagation()

const raycaster = new Raycaster()

function clearDistance(camera: Camera, scene: Scene, forward: Vector3): number {
  raycaster.set(camera.position, forward)
  raycaster.far = DISTANCE + CLEARANCE
  const nearest =
    raycaster.intersectObjects(scene.children, true)[0]?.distance ?? Number.POSITIVE_INFINITY
  return Math.max(MIN_DISTANCE, Math.min(DISTANCE, nearest - CLEARANCE))
}

function placeInFront(camera: Camera, scene: Scene): Placement {
  const yaw = camera.rotation.y
  const forward = new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
  const distance = clearDistance(camera, scene, forward)
  return {
    position: [
      camera.position.x + forward.x * distance,
      camera.position.y - 0.06 * (distance / DISTANCE),
      camera.position.z + forward.z * distance,
    ],
    yaw,
    distance,
  }
}

function drawOnTop(root: Object3D) {
  let order = OVERLAY_ORDER
  root.traverse((node) => {
    node.renderOrder = order
    order += 1
    const attached = (node as Mesh).material
    const materials: Material[] = Array.isArray(attached) ? attached : attached ? [attached] : []
    for (const material of materials) {
      material.depthTest = false
      material.depthWrite = false
    }
  })
}

function boxMaterials(poster: Texture | null): MeshBasicMaterial[] {
  const edge = new MeshBasicMaterial({ color: PALETTE.ink })
  const front = new MeshBasicMaterial({
    color: poster ? '#ffffff' : PALETTE.rustBright,
    map: poster,
  })
  return [edge, edge, edge, edge, front, edge]
}

function specs(item: CatalogItem): string {
  const rating = item.rating ? `★ ${item.rating.toFixed(1)}` : null
  return [metaLine(item), item.officialRating, rating].filter(Boolean).join(' · ')
}

function Badges({ item, y }: { item: CatalogItem; y: number }) {
  const left = CARD.x - CARD.width / 2 + CARD.pad
  const badges = badgesFor(item)
  const widths = badges.map((badge) => badge.label.length * 0.0105 + 0.02)
  const offsets = widths.map((_, i) => widths.slice(0, i).reduce((sum, w) => sum + w + 0.008, 0))
  const chips = badges.map((badge, i) => ({
    ...badge,
    width: widths[i] ?? 0,
    x: left + (offsets[i] ?? 0),
  }))
  return chips.map((chip) => (
    <group key={chip.kind} position={[chip.x + chip.width / 2, y, 0.002]}>
      <mesh>
        <planeGeometry args={[chip.width, 0.026]} />
        <meshBasicMaterial color={BADGE_COLORS[chip.kind].fill} />
      </mesh>
      <Text
        font={FONTS.display}
        fontSize={0.014}
        letterSpacing={0.08}
        color={BADGE_COLORS[chip.kind].text}
        position={[0, 0, 0.001]}
      >
        {chip.label.toUpperCase()}
      </Text>
    </group>
  ))
}

function DetailPanel({
  item,
  site,
  placement,
}: {
  item: CatalogItem
  site: SiteInfo | null
  placement: Placement
}) {
  const group = useRef<Group>(null)
  const grow = useRef(0)
  const settle = useRef(0)
  const poster = useTexture(item.imageTag ? posterUrl(item) : null)
  const select = useScene((state) => state.select)
  const materials = useMemo(() => boxMaterials(poster), [poster])

  useEffect(
    () => () => {
      for (const material of materials) {
        material.dispose()
      }
    },
    [materials],
  )

  useFrame((_, delta) => {
    grow.current = Math.min(1, grow.current + delta * 5)
    const eased = 0.6 + 0.4 * (1 - (1 - grow.current) ** 3)
    group.current?.scale.setScalar(SCALE * (placement.distance / DISTANCE) * eased)
    if (settle.current < SETTLE_FRAMES && group.current) {
      settle.current += 1
      drawOnTop(group.current)
    }
  })

  const top = CARD.height / 2
  const left = CARD.x - CARD.width / 2 + CARD.pad
  const textWidth = CARD.width - CARD.pad * 2
  const titleLines = Math.min(3, Math.ceil(item.title.length / TITLE_CHARS_PER_LINE))
  const metaY = top - 0.072 - titleLines * TITLE_SIZE * 1.1 - 0.008
  const buttonY = -CARD.height / 2 - 0.045
  const watch = () =>
    site && window.open(embyItemUrl(site, item.id), '_blank', 'noopener,noreferrer')

  return (
    <group
      ref={group}
      position={[...placement.position]}
      rotation={[0, placement.yaw, 0]}
      scale={SCALE * (placement.distance / DISTANCE) * 0.6}
    >
      <mesh
        position={[-0.16, 0.01, 0]}
        rotation={[0, 0.28, 0]}
        material={materials}
        onClick={stop}
        onPointerOver={stop}
        onPointerMove={stop}
      >
        <boxGeometry args={[0.2, 0.3, 0.036]} />
      </mesh>
      <mesh position={[CARD.x, 0, -0.004]}>
        <planeGeometry args={[CARD.width + 0.012, CARD.height + 0.012]} />
        <meshBasicMaterial color={PALETTE.ink} />
      </mesh>
      <mesh position={[CARD.x, 0, 0]} onClick={stop} onPointerOver={stop} onPointerMove={stop}>
        <planeGeometry args={[CARD.width, CARD.height]} />
        <meshBasicMaterial color={PALETTE.cream} />
      </mesh>
      <mesh position={[CARD.x, top - 0.028, 0.001]}>
        <planeGeometry args={[CARD.width, 0.056]} />
        <meshBasicMaterial color={PALETTE.rust} />
      </mesh>
      <Text
        font={FONTS.display}
        fontSize={0.02}
        letterSpacing={0.14}
        color={PALETTE.gold}
        anchorX="left"
        anchorY="middle"
        position={[left, top - 0.028, 0.002]}
      >
        {item.primaryGenre.toUpperCase()}
      </Text>
      <Text
        font={FONTS.display}
        fontSize={TITLE_SIZE}
        lineHeight={1.1}
        color={PALETTE.ink}
        anchorX="left"
        anchorY="top"
        maxWidth={textWidth}
        position={[left, top - 0.07, 0.002]}
      >
        {item.title}
      </Text>
      <Text
        font={FONTS.bodyBold}
        fontSize={0.0135}
        color="#6b4a36"
        anchorX="left"
        anchorY="top"
        maxWidth={textWidth}
        position={[left, metaY, 0.002]}
      >
        {specs(item)}
      </Text>
      <Badges item={item} y={metaY - 0.036} />
      <Text
        font={FONTS.body}
        fontSize={0.0132}
        lineHeight={1.42}
        color="#2f231b"
        anchorX="left"
        anchorY="top"
        maxWidth={textWidth}
        position={[left, metaY - 0.066, 0.002]}
      >
        {truncate(item.overview ?? 'No synopsis on the back of this box.', 320)}
      </Text>
      <Button3D
        position={[CARD.x - 0.07, buttonY, 0]}
        width={0.22}
        height={0.05}
        label="Watch on Emby"
        onSelect={watch}
      />
      <Button3D
        position={[CARD.x + 0.125, buttonY, 0]}
        width={0.13}
        height={0.05}
        label="Put back"
        variant="ghost"
        onSelect={() => select(null)}
      />
    </group>
  )
}

export function BoxDetail({ catalog, site }: { catalog: Catalog; site: SiteInfo | null }) {
  const selected = useScene((state) => state.selected)
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const item = selected ? catalog.byId.get(selected) : undefined
  const placement = useMemo(
    () => (item ? placeInFront(camera, scene) : null),
    [item, camera, scene],
  )
  return item && placement ? (
    <DetailPanel key={item.id} item={item} site={site} placement={placement} />
  ) : null
}
