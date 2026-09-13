import { Link } from 'react-router'

export function NotFound() {
  return (
    <main className="notice">
      <p className="notice__kicker">404</p>
      <h1 className="notice__title">Be kind, rewind.</h1>
      <p className="notice__detail">That tape isn’t on any shelf.</p>
      <Link className="button" to="/">
        Back to the front counter
      </Link>
    </main>
  )
}
