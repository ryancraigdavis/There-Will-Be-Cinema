export type PerfMode = 'off' | 'on' | 'sync'

const MODES: Record<string, PerfMode> = { '1': 'on', on: 'on', sync: 'sync' }

export function perfMode(search: string): PerfMode {
  return MODES[new URLSearchParams(search).get('perf') ?? ''] ?? 'off'
}

export function benchRequested(search: string): boolean {
  return perfMode(search) !== 'off' && new URLSearchParams(search).get('bench') === '1'
}

export function fixedStepMs(search: string): number | null {
  const ms = Number(new URLSearchParams(search).get('dt'))
  return perfMode(search) !== 'off' && ms > 0 && ms <= 100 ? ms : null
}

export function urlLabel(url: string): string {
  return url.split('?')[0]?.split('/').at(-1) ?? url
}

export function levelKey(width: number): string {
  return width >= 1024 ? String(width) : 'small'
}

export function textureMb(width: number, height: number, mipmaps = true): number {
  return (width * height * 4 * (mipmaps ? 4 / 3 : 1)) / 2 ** 20
}
