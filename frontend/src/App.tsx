import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { NotFound } from './pages/NotFound'
import { SearchPage } from './pages/SearchPage'

const StorePage = lazy(() =>
  import('./pages/StorePage').then((module) => ({ default: module.StorePage })),
)

export function App() {
  const onStore = useLocation().pathname === '/'
  const [visited, setVisited] = useState(onStore)

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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
