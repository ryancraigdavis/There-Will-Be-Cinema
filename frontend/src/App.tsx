import { Route, Routes } from 'react-router'
import { ClubPage } from './pages/ClubPage'
import { HomePage } from './pages/HomePage'
import { NotFound } from './pages/NotFound'
import { SearchPage } from './pages/SearchPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/club" element={<ClubPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
