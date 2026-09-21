import { describe, expect, it } from 'vitest'
import type { Catalog, CatalogItem, Collection } from '../catalog/types'
import { item } from '../test/fixtures'
import { bestPictureFilms, pickFilm } from './nowPlaying'

const film = (id: string, imageTag: string | null): CatalogItem => ({
  ...item('twbb'),
  id,
  title: id,
  imageTag,
})

const catalogOf = (films: CatalogItem[]): Catalog =>
  ({ items: films, byId: new Map(films.map((f) => [f.id, f])) }) as Catalog

const collection = (name: string, itemIds: string[]): Collection =>
  ({ id: 'c1', name, overview: null, imageTag: null, itemIds }) as Collection

describe('bestPictureFilms', () => {
  const films = [film('a', 'tag-a'), film('b', 'tag-b'), film('c', null)]
  const catalog = catalogOf(films)

  it.each([
    ['exact', 'Best Picture'],
    ['the real Emby name', 'Academy Awards - Best Picture Winners'],
    ['shouty', 'ACADEMY AWARDS — BEST PICTURE'],
  ])('finds the collection by %s name', (_name, title) => {
    const found = bestPictureFilms([collection(title, ['a', 'b'])], catalog)
    expect(found.map((f) => f.id)).toEqual(['a', 'b'])
  })

  it('skips films with no poster', () => {
    const found = bestPictureFilms([collection('Best Picture', ['a', 'c'])], catalog)
    expect(found.map((f) => f.id)).toEqual(['a'])
  })

  it('skips ids the catalog does not know', () => {
    const found = bestPictureFilms([collection('Best Picture', ['a', 'gone'])], catalog)
    expect(found.map((f) => f.id)).toEqual(['a'])
  })

  it.each([
    ['no such collection', [collection('Horror', ['a'])]],
    ['no collections yet', []],
    ['nothing loaded', null],
  ])('comes back empty with %s', (_name, collections) => {
    expect(bestPictureFilms(collections, catalog)).toEqual([])
  })

  it('comes back empty until the catalog arrives', () => {
    expect(bestPictureFilms([collection('Best Picture', ['a'])], null)).toEqual([])
  })
})

describe('pickFilm', () => {
  const films = [film('a', 't'), film('b', 't'), film('c', 't')]

  it.each([
    ['the first', 0, 'a'],
    ['the middle', 0.5, 'b'],
    ['the last', 0.99, 'c'],
    ['a roll of exactly one', 1, 'c'],
  ])('picks %s', (_name, roll, expected) => {
    expect(pickFilm(films, roll)?.id).toBe(expected)
  })

  it('has nothing to pick from an empty shelf', () => {
    expect(pickFilm([], 0.5)).toBeNull()
  })
})
