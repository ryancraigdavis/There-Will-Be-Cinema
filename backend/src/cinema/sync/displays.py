from collections.abc import Iterable, Mapping

Slot = tuple[str, str]

NEWEST = 200
PER_COLLECTION = 28
TOP_COLLECTIONS = 12


def _with_posters(item_ids: Iterable[str], tags: Mapping[str, str]) -> list[Slot]:
    return [(item_id, tags[item_id]) for item_id in item_ids if item_id in tags]


def _ranked(collections: Iterable[Mapping], tags: Mapping[str, str]) -> list[list[Slot]]:
    stocked = [
        (_with_posters(collection["item_ids"], tags), str(collection.get("name", "")))
        for collection in collections
    ]
    return [slots for slots, _ in sorted(stocked, key=lambda pair: (-len(pair[0]), pair[1]))]


def _unique(slots: Iterable[Slot]) -> list[Slot]:
    return list(dict(slots).items())


def pick_display(
    newest: Iterable[Slot],
    collections: Iterable[Mapping],
    tags: Mapping[str, str],
    cap: int,
    *,
    per_collection: int = PER_COLLECTION,
    top: int = TOP_COLLECTIONS,
) -> list[Slot]:
    featured = [
        slot for slots in _ranked(collections, tags)[:top] for slot in slots[:per_collection]
    ]
    return _unique([*newest, *featured])[:cap]
