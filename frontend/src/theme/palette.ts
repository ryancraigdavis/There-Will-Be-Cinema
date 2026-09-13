export const PALETTE = {
  rust: '#802614',
  rustBright: '#c7380f',
  sunset: '#e98313',
  gold: '#fccc0c',
  ink: '#010404',
  ember: '#41150d',
  cream: '#f4e6c8',
  laminate: '#cdb68c',
  wood: '#5a3a22',
  steel: '#2c2624',
  wall: '#3a1a12',
  ceiling: '#b9ae9a',
} as const

const GENRE_HUES = [8, 22, 36, 48, 0, 16, 30, 42]

function hashString(value: string): number {
  return [...value].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
}

export function spineColor(genre: string, seed: string): [number, number, number] {
  const hash = hashString(seed)
  const hue = (GENRE_HUES[hashString(genre) % GENRE_HUES.length] ?? 0) + (hash % 10)
  const lightness = 0.16 + ((hash >> 4) % 18) / 100
  return hslToRgb(hue / 360, 0.62, lightness)
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const channel = (t: number) => {
    const k = (t + 1) % 1
    const segments: [boolean, number][] = [
      [k < 1 / 6, p + (q - p) * 6 * k],
      [k < 1 / 2, q],
      [k < 2 / 3, p + (q - p) * (2 / 3 - k) * 6],
      [true, p],
    ]
    return segments.find(([hit]) => hit)?.[1] ?? p
  }
  return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)]
}
