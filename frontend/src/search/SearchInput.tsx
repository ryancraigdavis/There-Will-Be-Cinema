import { useEffect, useId, useRef, useState } from 'react'
import { formatCount } from '../catalog/format'
import { SearchIcon } from '../ui/icons'

interface Props {
  value: string
  total: number
  onCommit: (query: string) => void
}

export function SearchInput({ value, total, onCommit }: Props) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const editing = useRef(false)
  const latest = useRef(value)

  useEffect(() => {
    latest.current = value
    if (!editing.current) {
      setDraft(value)
    }
  }, [value])

  return (
    <div className="search-box">
      <label htmlFor={id} className="visually-hidden">
        Search titles
      </label>
      <SearchIcon />
      <input
        id={id}
        type="search"
        value={draft}
        placeholder={`Search ${formatCount(total, 'title')}`}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        onFocus={() => {
          editing.current = true
        }}
        onBlur={() => {
          editing.current = false
          setDraft(latest.current)
        }}
        onChange={(event) => {
          setDraft(event.target.value)
          onCommit(event.target.value)
        }}
      />
    </div>
  )
}
