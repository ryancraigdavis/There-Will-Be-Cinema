import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { useScreenings } from './club/screenings'
import { useClubSession } from './club/session'
import { AdminPage } from './pages/AdminPage'
import { ClubPage } from './pages/ClubPage'
import { NotFound } from './pages/NotFound'
import { SearchPage } from './pages/SearchPage'

const StorePage = lazy(() =>
  import('./pages/StorePage').then((module) => ({ default: module.StorePage })),
)

export function App() {
  const onStore = useLocation().pathname === '/'
  const [visited, setVisited] = useState(onStore)

  useEffect(() => {
    void useClubSession.getState().refresh()
    void useScreenings.getState().refresh()
  }, [])

  useEffect(() => {
    if (onStore) {
      setVisited(true)
    }
  }, [onStore])

  return (
    <>
      {(visited || onStore) && (
        <Suspense fallback={null}>
          <StorePage active={onStore} />
        </Suspense>
      )}
      <Routes>
        <Route path="/" element={null} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/club" element={<ClubPage />} />
        <Route path="/club/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
