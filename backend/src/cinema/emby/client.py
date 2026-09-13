from collections.abc import AsyncIterator

import httpx

FIELDS = ",".join(
    [
        "Genres",
        "Tags",
        "Overview",
        "ProviderIds",
        "CommunityRating",
        "ProductionYear",
        "MediaSources",
        "OfficialRating",
        "ImageTags",
        "DateCreated",
        "DateLastSaved",
        "RunTimeTicks",
        "ChildCount",
        "SortName",
    ]
)
LIBRARY_TYPES = "Movie,Series"
PAGE_SIZE = 200


def _is_admin(user: dict) -> bool:
    return bool((user.get("Policy") or {}).get("IsAdministrator"))


class EmbyClient:
    def __init__(self, base_url: str, api_key: str, timeout: float = 60.0) -> None:
        self._http = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            headers={"X-Emby-Token": api_key},
            timeout=timeout,
        )
        self._user_id: str | None = None

    async def close(self) -> None:
        await self._http.aclose()

    async def _get_json(self, path: str, params: dict | None = None) -> dict:
        resp = await self._http.get(path, params=params)
        resp.raise_for_status()
        return resp.json()

    async def user_id(self) -> str:
        users = await self._get_json("/Users")
        chosen = next((u for u in users if _is_admin(u)), users[0])
        self._user_id = self._user_id or str(chosen["Id"])
        return self._user_id

    async def _items_page(self, params: dict) -> dict:
        uid = await self.user_id()
        return await self._get_json(f"/Users/{uid}/Items", params=params)

    async def iter_items(
        self,
        types: str = LIBRARY_TYPES,
        since: str | None = None,
        page_size: int = PAGE_SIZE,
    ) -> AsyncIterator[dict]:
        base = {
            "IncludeItemTypes": types,
            "Recursive": "true",
            "Fields": FIELDS,
            "SortBy": "SortName",
            "SortOrder": "Ascending",
            "Limit": page_size,
            **({"MinDateLastSaved": since} if since else {}),
        }
        start, total = 0, 1
        while start < total:
            page = await self._items_page({**base, "StartIndex": start})
            total = int(page.get("TotalRecordCount", 0))
            start += page_size
            for item in page.get("Items", []):
                yield item

    async def boxsets(self) -> list[dict]:
        page = await self._items_page(
            {
                "IncludeItemTypes": "BoxSet",
                "Recursive": "true",
                "Fields": "Overview,ImageTags,SortName",
                "SortBy": "SortName",
                "Limit": 500,
            }
        )
        return list(page.get("Items", []))

    async def boxset_children(self, parent_id: str) -> list[str]:
        page = await self._items_page(
            {"ParentId": parent_id, "IncludeItemTypes": LIBRARY_TYPES, "Limit": 1000}
        )
        return [str(i["Id"]) for i in page.get("Items", [])]

    async def image_bytes(self, item_id: str, tag: str, max_width: int) -> bytes | None:
        resp = await self._http.get(
            f"/Items/{item_id}/Images/Primary",
            params={"tag": tag, "maxWidth": max_width, "quality": 85},
        )
        return resp.content if resp.status_code == 200 else None
