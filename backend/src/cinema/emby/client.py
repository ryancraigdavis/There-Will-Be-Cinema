from collections.abc import AsyncIterator

import httpx

from cinema.emby import auth
from cinema.emby.models import EmbyUser

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
    def __init__(
        self,
        base_url: str,
        api_key: str,
        timeout: float = 60.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._http = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            headers={"X-Emby-Token": api_key},
            timeout=timeout,
            transport=transport,
        )
        self._base_url = base_url
        self._transport = transport
        self._user_id: str | None = None
        self._server_id: str | None = None

    async def close(self) -> None:
        await self._http.aclose()

    async def authenticate(self, username: str, password: str) -> EmbyUser:
        return await auth.authenticate(self._base_url, username, password, self._transport)

    async def _get_json(self, path: str, params: dict | None = None) -> dict:
        resp = await self._http.get(path, params=params)
        resp.raise_for_status()
        return resp.json()

    async def user_id(self) -> str:
        users = await self._get_json("/Users")
        chosen = next((u for u in users if _is_admin(u)), users[0])
        self._user_id = self._user_id or str(chosen["Id"])
        return self._user_id

    async def server_id(self) -> str | None:
        self._server_id = self._server_id or await self._public_server_id()
        return self._server_id

    async def _public_server_id(self) -> str | None:
        try:
            info = await self._get_json("/System/Info/Public")
        except httpx.HTTPError:
            info = {}
        return info.get("Id")

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

    async def all_ids(self, types: str = LIBRARY_TYPES, page_size: int = 1000) -> list[str]:
        base = {"IncludeItemTypes": types, "Recursive": "true", "Fields": "", "Limit": page_size}
        ids: list[str] = []
        start, total = 0, 1
        while start < total:
            page = await self._items_page({**base, "StartIndex": start})
            total = int(page.get("TotalRecordCount", 0))
            start += page_size
            ids.extend(str(item["Id"]) for item in page.get("Items", []))
        return ids

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
