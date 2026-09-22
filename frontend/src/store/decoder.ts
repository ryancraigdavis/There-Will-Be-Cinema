import { urlLabel } from '../perf/mode'
import { perf } from '../perf/perf'
import type { CancelRequest, DecodeReply, DecodeRequest } from './decodeProtocol'

export interface Decoded {
  width: number
  height: number
  bands: ImageBitmap[]
}

interface Waiting {
  resolve: (decoded: Decoded) => void
  reject: (error: Error) => void
  url: string
  started: number
}

let worker: Worker | null = null
let nextId = 1
const waiting = new Map<number, Waiting>()

function settle({ id, width, height, bands, error }: DecodeReply) {
  const job = waiting.get(id)
  waiting.delete(id)
  if (!job) {
    for (const band of bands) {
      band.close()
    }
    return
  }
  perf.event(
    `fetch+decode ${urlLabel(job.url)}`,
    performance.now() - job.started,
    width * height * 4,
  )
  error ? job.reject(new Error(error)) : job.resolve({ width, height, bands })
}

function post(message: DecodeRequest | CancelRequest) {
  worker ??= new Worker(new URL('./decodeWorker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (event: MessageEvent<DecodeReply>) => settle(event.data)
  worker.postMessage(message)
}

export function decodeInWorker(url: string, signal: AbortSignal): Promise<Decoded> {
  const id = nextId++
  signal.addEventListener('abort', () => post({ id, cancel: true }))
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject, url, started: performance.now() })
    post({ id, url })
  })
}

export function decodesPending(): number {
  return waiting.size
}
