import { describe, expect, it } from 'vitest'
import { ANCHORS } from '../lobby/anchors'
import { isBlocked } from '../player/collision'
import { PLAYER_RADIUS, walk } from '../player/locomotion'
import { buildStorePlan } from '../store/layout'
import { catalogFixture } from '../test/fixtures'
import { sceneColliders } from './colliders'

const colliders = sceneColliders(buildStorePlan(catalogFixture().items))

describe('scene colliders', () => {
  it.each(Object.entries(ANCHORS))('anchor %s is standing room', (_id, pose) => {
    expect(isBlocked({ x: pose.position[0], z: pose.position[2] }, PLAYER_RADIUS, colliders)).toBe(
      false,
    )
  })

  it('lets you walk from the gate down the center aisle', () => {
    let pose = ANCHORS.storeEntry
    for (let frame = 0; frame < 120; frame++) {
      pose = walk(pose, { forward: 1, strafe: 0, run: false }, 1 / 40, colliders)
    }
    expect(pose.position[2]).toBeLessThan(-4.5)
    expect(Math.abs(pose.position[0])).toBeLessThan(0.05)
  })

  it('keeps you inside the room', () => {
    let pose = { ...ANCHORS.counter, yaw: Math.PI }
    for (let frame = 0; frame < 400; frame++) {
      pose = walk(pose, { forward: 1, strafe: 0, run: true }, 1 / 20, colliders)
    }
    expect(pose.position[2]).toBeLessThan(8)
  })
})
