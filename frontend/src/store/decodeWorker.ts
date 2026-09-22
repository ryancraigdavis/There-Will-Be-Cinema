import {
  bandRects,
  type CancelRequest,
  DECODE_OPTIONS,
  type DecodeReply,
  type DecodeRequest,
  isCancel,
} from './decodeProtocol'

interface Scope {
  onmessage: ((event: MessageEvent<DecodeRequest | CancelRequest>) => void) | null
  postMessage: (reply: DecodeReply, transfer: Transferable[]) => void
}

const scope = self as unknown as Scope
const pending = new Map<number, AbortController>()

async function cropBands(full: ImageBitmap): Promise<ImageBitmap[]> {
  const rects = bandRects(full.width, full.height)
  const whole = rects.length === 1
  const bands = whole
    ? [full]
    : await Promise.all(
        rects.map((band) => createImageBitmap(full, 0, band.y, full.width, band.height)),
      )
  if (!whole) {
    full.close()
  }
  return bands
}

async function decode({ id, url }: DecodeRequest, signal: AbortSignal): Promise<DecodeReply> {
  const response = await fetch(url, { signal })
  const full = await createImageBitmap(await response.blob(), DECODE_OPTIONS)
  const { width, height } = full
  return { id, width, height, bands: await cropBands(full) }
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
  scope.postMessage(reply, reply.bands)
}

scope.onmessage = ({ data }) => {
  if (isCancel(data)) {
    pending.get(data.id)?.abort()
    return
  }
  void handle(data)
}
