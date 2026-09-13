from fastapi import APIRouter, Request, Response

from cinema.api.deps import cache_of

router = APIRouter(tags=["catalog"])
_CACHE_HEADERS = {"Cache-Control": "no-cache", "Vary": "Accept-Encoding"}


@router.get("/catalog")
async def catalog(request: Request) -> Response:
    payload = cache_of(request).payload()
    matched = request.headers.get("if-none-match") == payload.etag
    headers = {**_CACHE_HEADERS, "ETag": payload.etag}
    responses = {
        True: lambda: Response(status_code=304, headers=headers),
        False: lambda: Response(
            content=payload.body_gzip,
            media_type="application/json",
            headers={**headers, "Content-Encoding": "gzip"},
        ),
    }
    return responses[matched]()


@router.get("/collections")
async def collections(request: Request) -> Response:
    return Response(content=cache_of(request).collections(), media_type="application/json")
