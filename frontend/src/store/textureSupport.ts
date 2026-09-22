export interface DecodeFeatures {
  worker: boolean
  wasm: boolean
}

export function workerDecodeSupported({ worker, wasm }: DecodeFeatures): boolean {
  return worker && wasm
}
