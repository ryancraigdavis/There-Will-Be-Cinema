import { addAfterEffect, addEffect, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { type Camera, Mesh, Vector3, type WebGLRenderer } from 'three'
import { useScene } from '../shell/sceneState'
import { gpuTimer } from './gpuTimer'
import { perf } from './perf'

type Methods = Record<string, ((...args: unknown[]) => unknown) | undefined>

const GL_CALLS = [
  'texImage2D',
  'texSubImage2D',
  'texStorage2D',
  'generateMipmap',
  'compileShader',
  'linkProgram',
  'bufferData',
  'bufferSubData',
]
const ENTRY_TYPES = ['long-animation-frame', 'longtask']
const MOVED_METRES = 0.001

function countCall(context: WebGL2RenderingContext, name: string): () => void {
  const methods = context as unknown as Methods
  const original = methods[name]
  methods[name] = (...args) => {
    perf.count(`gl.${name}`)
    return original?.apply(context, args)
  }
  return () => Reflect.deleteProperty(methods, name)
}

function countGlCalls(context: WebGL2RenderingContext): () => void {
  const restore = GL_CALLS.map((name) => countCall(context, name))
  return () => restore.forEach((undo) => void undo())
}

function countRaycasts(): () => void {
  const original = Mesh.prototype.raycast
  Mesh.prototype.raycast = function raycast(raycaster, intersects) {
    perf.count('raycast.tests')
    original.call(this, raycaster, intersects)
  }
  return () => {
    Mesh.prototype.raycast = original
  }
}

interface LongEntry extends PerformanceEntry {
  blockingDuration?: number
  scripts?: { invoker?: string; duration: number }[]
}

function noteEntry(entry: LongEntry) {
  const scripts = (entry.scripts ?? [])
    .slice(0, 3)
    .map((script) => `${script.invoker ?? 'script'}:${script.duration.toFixed(0)}`)
    .join(' ')
  const blocking = (entry.blockingDuration ?? 0).toFixed(0)
  perf.note(`${entry.entryType} blocking=${blocking} ${scripts}`, entry.startTime, entry.duration)
}

function observeLongFrames(): () => void {
  const supported = globalThis.PerformanceObserver?.supportedEntryTypes ?? []
  const type = ENTRY_TYPES.find((name) => supported.includes(name))
  if (!type) {
    return () => undefined
  }
  const observer = new PerformanceObserver((list) => list.getEntries().forEach(noteEntry))
  observer.observe({ type, buffered: true })
  return () => observer.disconnect()
}

function publishInfo(gl: WebGLRenderer) {
  perf.gauge('draws', gl.info.render.calls)
  perf.gauge('triangles', gl.info.render.triangles)
  perf.gauge('textures', gl.info.memory.textures)
  perf.gauge('geometries', gl.info.memory.geometries)
  perf.gauge('programs', gl.info.programs?.length ?? 0)
}

function countMoving(camera: Camera, last: Vector3) {
  const moving = camera.position.distanceTo(last) > MOVED_METRES
  last.copy(camera.position)
  perf.count('frames.moving', moving ? 1 : 0)
  perf.count('upload.4096.moving', moving ? perf.peek('upload.steps.4096') : 0)
}

function watchFrames(gl: WebGLRenderer, camera: Camera): () => void {
  const timer = gpuTimer(gl.getContext() as WebGL2RenderingContext)
  const last = new Vector3().copy(camera.position)
  let began = 0
  const forget = () => {
    began = 0
  }
  const stopBefore = addEffect(() => {
    const now = performance.now()
    if (began) {
      perf.endFrame(now - began, now)
    }
    began = now
    timer.begin()
  })
  const stopAfter = addAfterEffect(() => {
    timer.end()
    perf.count('cpu.ms', performance.now() - began)
    publishInfo(gl)
    countMoving(camera, last)
  })
  document.addEventListener('visibilitychange', forget)
  return () => {
    stopBefore()
    stopAfter()
    document.removeEventListener('visibilitychange', forget)
  }
}

export function PerfProbe({ active }: { active: boolean }) {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)

  useEffect(() => countGlCalls(gl.getContext() as WebGL2RenderingContext), [gl])
  useEffect(countRaycasts, [])
  useEffect(observeLongFrames, [])
  useEffect(() => useScene.subscribe(() => perf.count('zustand.scene')), [])
  useEffect(() => (active ? watchFrames(gl, camera) : undefined), [gl, camera, active])

  return null
}
