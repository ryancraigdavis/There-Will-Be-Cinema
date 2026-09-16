import sqlite3

from cinema.db import club_repo


class FilmProblem(ValueError):
    pass


def _library(conn: sqlite3.Connection, item_id: str, *_: object) -> dict:
    film = club_repo.film(conn, item_id)
    if film is None:
        raise FilmProblem("that film is not in the library")
    return {
        "item_id": film["id"],
        "title": film["title"],
        "year": film["year"],
        "overview": film["overview"],
    }


def _typed(_: sqlite3.Connection, __: str | None, title: str, year: int | None) -> dict:
    if not title.strip():
        raise FilmProblem("give the film a title")
    return {"item_id": None, "title": title.strip(), "year": year, "overview": None}


def resolve(conn: sqlite3.Connection, item_id: str | None, title: str, year: int | None) -> dict:
    source = _library if item_id else _typed
    return source(conn, item_id, title, year)
