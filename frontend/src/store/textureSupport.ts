const SAFARI = /^((?!chrome|android).)*safari/i
const SAFARI_VERSION = /Version\/(\d+)/
const FIREFOX_VERSION = /Firefox\/(\d+)\./

export function bitmapsSupported(userAgent: string, hasCreateImageBitmap: boolean): boolean {
  const safari = SAFARI.test(userAgent) ? Number(userAgent.match(SAFARI_VERSION)?.[1] ?? 0) : null
  const firefox = Number(userAgent.match(FIREFOX_VERSION)?.[1] ?? Number.POSITIVE_INFINITY)
  return hasCreateImageBitmap && (safari === null || safari >= 17) && firefox >= 98
}
