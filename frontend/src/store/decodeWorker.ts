import wasmUrl from '@jsquash/webp/codec/dec/webp_dec.wasm?url'
import decodeWebp, { init } from '@jsquash/webp/decode'
import {
  type CancelRequest,
  type DecodeReply,
  type DecodeRequest,
  isCancel,
  pixelBands,
} from './decodeProtocol'

interface Scope {
  onmessage: ((event: MessageEvent<DecodeRequest | CancelRequest>) => void) | null
  postMessage: (reply: DecodeReply, transfer: Transferable[]) => void
}

const scope = self as unknown as Scope
const pending = new Map<number, AbortController>()
const ready = init({ locateFile: () => wasmUrl })

async function decode({ id, url }: DecodeRequest, signal: AbortSignal): Promise<DecodeReply> {
  const response = await fetch(url, { signal })
  const bytes = await response.arrayBuffer()
  await ready
  const { width, height, data } = await decodeWebp(bytes)
  return { id, width, height, bands: pixelBands(data, width, height) }
}

function failure(id: number, error: unknown): DecodeReply {
  return { id, width: 0, height: 0, bands: [], error: String(error) }
}

async function handle(request: DecodeRequest) {
  const controller = new AbortController()
  pending.set(request.id, controller)
  const reply = await decode(request, controller.signal).catch((error: unknown) =>
    failure(request.id, error),
  )
  pending.delete(request.id)
  scope.postMessage(
    reply,
    reply.bands.map((band) => band.data.buffer),
  )
}

scope.onmessage = ({ data }) => {
  if (isCancel(data)) {
    pending.get(data.id)?.abort()
    return
  }
  void handle(data)
}
