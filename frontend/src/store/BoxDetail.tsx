import { Text } from '@react-three/drei'
import { type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { runtimesDiffer, versionDetail, versionLabel } from '../catalog/versions'
import { timed } from '../perf/perf'
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
const CHIPS = { y: -0.178, height: 0.03, gap: 0.008, captionY: -0.142 }
const OVERVIEW_LIMIT = { single: 320, many: 200 }

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
  const hits = timed('detail clear-space raycast', () =>
    raycaster.intersectObjects(scene.children, true),
  )
  const nearest = hits[0]?.distance ?? Number.POSITIVE_INFINITY
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

interface VersionsProps {
  versions: CatalogItem[]
  chosen: CatalogItem
  onChoose: (version: CatalogItem) => void
}

function Versions({ versions, chosen, onChoose }: VersionsProps) {
  const left = CARD.x - CARD.width / 2 + CARD.pad
  const usable = CARD.width - CARD.pad * 2
  const width = (usable - CHIPS.gap * (versions.length - 1)) / versions.length
  const showRuntime = runtimesDiffer(versions)
  return (
    <>
      <Text
        font={FONTS.display}
        fontSize={0.012}
        letterSpacing={0.16}
        color="#8a6a52"
        anchorX="left"
        anchorY="middle"
        position={[left, CHIPS.captionY, 0.002]}
      >
        VERSIONS
      </Text>
      {versions.map((version, i) => {
        const picked = version.id === chosen.id
        return (
          <group
            key={version.id}
            position={[left + i * (width + CHIPS.gap) + width / 2, CHIPS.y, 0.002]}
            onClick={(event) => {
              event.stopPropagation()
              onChoose(version)
            }}
            onPointerOver={stop}
            onPointerMove={stop}
          >
            <mesh>
              <planeGeometry args={[width, CHIPS.height]} />
              <meshBasicMaterial color={picked ? PALETTE.gold : PALETTE.ink} />
            </mesh>
            <Text
              font={FONTS.display}
              fontSize={0.0125}
              letterSpacing={0.04}
              color={picked ? PALETTE.ink : PALETTE.cream}
              anchorY="middle"
              maxWidth={width - 0.012}
              position={[0, 0.005, 0.001]}
            >
              {versionLabel(version, showRuntime).toUpperCase()}
            </Text>
            <Text
              font={FONTS.body}
              fontSize={0.0085}
              color={picked ? '#4a3b16' : '#b6a894'}
              anchorY="middle"
              maxWidth={width - 0.012}
              position={[0, -0.008, 0.001]}
            >
              {versionDetail(version)}
            </Text>
          </group>
        )
      })}
    </>
  )
}

interface PanelProps {
  film: CatalogItem
  versions: CatalogItem[]
  site: SiteInfo | null
  placement: Placement
}

function DetailPanel({ film, versions, site, placement }: PanelProps) {
  const group = useRef<Group>(null)
  const grow = useRef(0)
  const settle = useRef(0)
  const [chosen, setChosen] = useState<CatalogItem>(versions[0] ?? film)
  const poster = useTexture(film.imageTag ? posterUrl(film) : null)
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

  const many = versions.length > 1
  const top = CARD.height / 2
  const left = CARD.x - CARD.width / 2 + CARD.pad
  const textWidth = CARD.width - CARD.pad * 2
  const titleLines = Math.min(3, Math.ceil(film.title.length / TITLE_CHARS_PER_LINE))
  const metaY = top - 0.072 - titleLines * TITLE_SIZE * 1.1 - 0.008
  const buttonY = -CARD.height / 2 - 0.045
  const watch = () =>
    site && window.open(embyItemUrl(site, chosen.id), '_blank', 'noopener,noreferrer')

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
        {film.primaryGenre.toUpperCase()}
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
        {film.title}
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
        {specs(chosen)}
      </Text>
      <Badges item={chosen} y={metaY - 0.036} />
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
        {truncate(
          film.overview ?? 'No synopsis on the back of this box.',
          many ? OVERVIEW_LIMIT.many : OVERVIEW_LIMIT.single,
        )}
      </Text>
      {many && <Versions versions={versions} chosen={chosen} onChoose={setChosen} />}
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
  const film = selected ? catalog.byId.get(selected) : undefined
  const placement = useMemo(
    () => (film ? placeInFront(camera, scene) : null),
    [film, camera, scene],
  )
  return film && placement ? (
    <DetailPanel
      key={film.id}
      film={film}
      versions={catalog.versionsById.get(film.id) ?? [film]}
      site={site}
      placement={placement}
    />
  ) : null
}
