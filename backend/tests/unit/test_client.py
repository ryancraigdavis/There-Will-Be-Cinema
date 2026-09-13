import httpx

from cinema.emby.client import EmbyClient


def _client(handler) -> EmbyClient:
    return EmbyClient("http://emby.test", "key", transport=httpx.MockTransport(handler))


async def test_server_id_is_fetched_once_with_token():
    calls: list[tuple[str, str]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append((request.url.path, request.headers["X-Emby-Token"]))
        return httpx.Response(200, json={"Id": "abc123"})

    client = _client(handler)
    assert await client.server_id() == "abc123"
    assert await client.server_id() == "abc123"
    assert calls == [("/System/Info/Public", "key")]
    await client.close()


async def test_server_id_is_none_when_unreachable():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("down", request=request)

    client = _client(handler)
    assert await client.server_id() is None
    await client.close()
