import './perf.css'
import { useEffect, useState } from 'react'
import { hudLines, perFrame, staleLevels } from './hudModel'
import { perf } from './perf'

const REFRESH_MS = 250

export function PerfHud({ levels }: { levels: readonly number[] }) {
  const [lines, setLines] = useState<string[]>([])

  useEffect(() => {
    let previous = perf.snapshot()
    const timer = setInterval(() => {
      const next = perf.snapshot()
      setLines(hudLines(next, perFrame(previous, next), levels))
      previous = next
    }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [levels])

  return (
    <pre className="perf-hud" data-stale={staleLevels(levels)}>
      {lines.join('\n')}
    </pre>
  )
}
