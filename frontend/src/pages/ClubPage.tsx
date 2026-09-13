import { useEffect } from 'react'
import { readyValue, useSite } from '../catalog/resources'

export function ClubPage() {
  const site = useSite()
  const target = readyValue(site)?.clubUrl
  useEffect(() => {
    if (target) {
      window.location.replace(target)
    }
  }, [target])
  return (
    <main className="notice">
      <img src="/logo-128.webp" alt="" width={96} height={96} />
      <h1 className="notice__title">Heading to the movie club…</h1>
      {target && (
        <a className="button" href={target}>
          Go now
        </a>
      )}
      {site.status === 'error' && <p className="notice__detail">{site.message}</p>}
    </main>
  )
}
