import type { Resource } from '../catalog/resources'

interface Props {
  resource: Resource<unknown>
  loading: string
}

export function StatusPanel({ resource, loading }: Props) {
  return resource.status === 'error' ? (
    <div className="status" role="alert">
      <p className="status__title">The tape got eaten.</p>
      <p className="status__detail">{resource.message}</p>
      <button type="button" className="button" onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  ) : (
    <div className="status">
      <span className="reel" aria-hidden="true" />
      <p className="status__title">{loading}</p>
    </div>
  )
}
