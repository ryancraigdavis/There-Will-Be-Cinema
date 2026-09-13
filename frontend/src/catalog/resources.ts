import { useEffect, useState } from 'react'
import { fetchCatalog, fetchSite } from '../api'

export type Resource<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; value: T }

function cached<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null
  return () => {
    pending ??= load().catch((error: unknown) => {
      pending = null
      throw error
    })
    return pending
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export const loadCatalog = cached(fetchCatalog)
export const loadSite = cached(fetchSite)

export function useResource<T>(load: () => Promise<T>): Resource<T> {
  const [state, setState] = useState<Resource<T>>({ status: 'loading' })
  useEffect(() => {
    let live = true
    load().then(
      (value) => live && setState({ status: 'ready', value }),
      (error: unknown) => live && setState({ status: 'error', message: describe(error) }),
    )
    return () => {
      live = false
    }
  }, [load])
  return state
}

export const useCatalog = () => useResource(loadCatalog)
export const useSite = () => useResource(loadSite)

export function readyValue<T>(resource: Resource<T>): T | null {
  return resource.status === 'ready' ? resource.value : null
}
