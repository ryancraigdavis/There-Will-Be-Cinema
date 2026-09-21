import type { Catalog, CatalogItem, Collection } from '../catalog/types'

/** The board pins a winner from this Emby collection, matched loosely so a rename survives. */
export const BEST_PICTURE = 'best picture'

export function bestPictureFilms(
  collections: readonly Collection[] | null,
  catalog: Catalog | null,
): CatalogItem[] {
  const collection = collections?.find((entry) => entry.name.toLowerCase().includes(BEST_PICTURE))
  return (collection?.itemIds ?? []).flatMap((id) => {
    const film = catalog?.byId.get(id)
    return film && film.imageTag !== null ? [film] : []
  })
}

/** `roll` is a 0..1 pick, so the caller owns the randomness and tests stay deterministic. */
export function pickFilm(films: readonly CatalogItem[], roll: number): CatalogItem | null {
  const index = Math.min(films.length - 1, Math.floor(roll * films.length))
  return films[index] ?? null
}
