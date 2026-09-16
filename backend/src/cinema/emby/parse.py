import re

from cinema.emby.models import AudioStream, CollectionRow, ItemRow, MediaInfo, VideoStream

TICKS_PER_MINUTE = 600_000_000
UHD_WIDTH = 3840
_HDR_BY_NAME = {
    "dolbyvision": "Dolby Vision",
    "hdr10plus": "HDR10+",
    "hdr10": "HDR10",
    "hlg": "HLG",
}
_HDR_BY_TRANSFER = {"smpte2084": "HDR10", "arib-std-b67": "HLG"}
_DV_PROFILE = re.compile(r"DoviProfile(\d)(\d?)")
_LOSSLESS_CODECS = {"truehd", "flac", "mlp", "alac"}
_DTS_PROFILES = {"DTS-HD MA", "DTS-HD HRA", "DTS-ES", "DTS:X"}
_CODEC_LABELS = {
    "truehd": "TrueHD",
    "eac3": "DD+",
    "ac3": "DD",
    "dts": "DTS",
    "dca": "DTS",
    "aac": "AAC",
    "flac": "FLAC",
    "opus": "Opus",
    "mp3": "MP3",
    "mp2": "MP2",
    "vorbis": "Vorbis",
    "alac": "ALAC",
}


def _squash(value: object) -> str:
    return str(value or "").replace(" ", "").lower()


def _hdr_type(stream: dict) -> str:
    by_type = _HDR_BY_NAME.get(_squash(stream.get("ExtendedVideoType")))
    by_range = _HDR_BY_NAME.get(_squash(stream.get("VideoRange")))
    by_transfer = _HDR_BY_TRANSFER.get(_squash(stream.get("ColorTransfer")))
    return by_type or by_range or by_transfer or "SDR"


def _dv_profile(stream: dict) -> str | None:
    match = _DV_PROFILE.search(str(stream.get("ExtendedVideoSubType") or ""))
    return ".".join(g for g in match.groups() if g) if match else None


def parse_video_stream(stream: dict) -> VideoStream:
    width = stream.get("Width")
    return VideoStream(
        codec=stream.get("Codec"),
        width=width,
        height=stream.get("Height"),
        bit_depth=stream.get("BitDepth"),
        hdr_type=_hdr_type(stream),
        dv_profile=_dv_profile(stream),
        is_4k=(width or 0) >= UHD_WIDTH,
    )


def parse_audio_stream(stream: dict) -> AudioStream:
    codec = (stream.get("Codec") or "").lower()
    profile = (stream.get("Profile") or "").upper()
    text = " ".join(str(stream.get(k) or "") for k in ("Profile", "Title", "DisplayTitle")).lower()
    return AudioStream(
        codec=stream.get("Codec"),
        profile=stream.get("Profile"),
        channels=stream.get("Channels"),
        channel_layout=stream.get("ChannelLayout"),
        language=stream.get("Language"),
        is_default=bool(stream.get("IsDefault", False)),
        is_atmos="atmos" in text,
        is_dts_x="dts:x" in text or "dts-x" in text,
        is_lossless=codec in _LOSSLESS_CODECS or codec.startswith("pcm") or profile == "DTS-HD MA",
    )


def parse_media_source(source: dict) -> MediaInfo:
    streams = source.get("MediaStreams") or []
    videos = [s for s in streams if s.get("Type") == "Video"]
    audios = [parse_audio_stream(s) for s in streams if s.get("Type") == "Audio"]
    primary = next((a for a in audios if a.is_default), next(iter(audios), None))
    return MediaInfo(
        container=source.get("Container"),
        file_size=source.get("Size"),
        video=next((parse_video_stream(v) for v in videos), None),
        audio_streams=audios,
        primary_audio=primary,
    )


def _width(info: MediaInfo) -> int:
    return (info.video.width if info.video else 0) or 0


def best_media_source(item: dict) -> MediaInfo | None:
    sources = [parse_media_source(s) for s in item.get("MediaSources") or []]
    return max(sources, key=_width, default=None)


def _audio_label(audio: AudioStream) -> str:
    codec = (audio.codec or "").lower()
    fallback = "PCM" if codec.startswith("pcm") else codec.upper()
    base = _CODEC_LABELS.get(codec, fallback)
    profile = (audio.profile or "").upper()
    name = profile if profile in _DTS_PROFILES else base
    suffix = {True: " Atmos", False: ""}[audio.is_atmos]
    return f"{name}{suffix} {audio.channel_layout or ''}".strip()


def _audio_summary(audio: AudioStream | None) -> str | None:
    return _audio_label(audio) if audio else None


def _runtime_minutes(ticks: int | None) -> int | None:
    return None if ticks is None else round(ticks / TICKS_PER_MINUTE)


def flatten_item(raw: dict) -> ItemRow:
    media = best_media_source(raw)
    video = media.video if media else None
    audios = media.audio_streams if media else []
    genres = list(raw.get("Genres") or [])
    return ItemRow(
        id=str(raw["Id"]),
        type=raw.get("Type", "Movie"),
        title=raw.get("Name", ""),
        sort_title=raw.get("SortName") or raw.get("Name", ""),
        year=raw.get("ProductionYear"),
        overview=raw.get("Overview"),
        runtime_min=_runtime_minutes(raw.get("RunTimeTicks")),
        community_rating=raw.get("CommunityRating"),
        official_rating=raw.get("OfficialRating"),
        genres=genres,
        primary_genre=next(iter(genres), "Uncategorized"),
        tags=list(raw.get("Tags") or []),
        provider_ids={k: str(v) for k, v in (raw.get("ProviderIds") or {}).items()},
        date_created=raw.get("DateCreated"),
        date_last_saved=raw.get("DateLastSaved"),
        image_tag=(raw.get("ImageTags") or {}).get("Primary"),
        is_4k=bool(video and video.is_4k),
        hdr_format=video.hdr_type if video else None,
        dv_profile=video.dv_profile if video else None,
        has_atmos=any(a.is_atmos for a in audios),
        has_dtsx=any(a.is_dts_x for a in audios),
        audio_codec_summary=_audio_summary(media.primary_audio if media else None),
        width=video.width if video else None,
        height=video.height if video else None,
        file_size=media.file_size if media else None,
        container=media.container if media else None,
        video_codec=video.codec if video else None,
        child_count=raw.get("ChildCount"),
    )


def flatten_collection(raw: dict, child_ids: list[str]) -> CollectionRow:
    return CollectionRow(
        id=str(raw["Id"]),
        name=raw.get("Name", ""),
        overview=raw.get("Overview"),
        image_tag=(raw.get("ImageTags") or {}).get("Primary"),
        item_ids=child_ids,
    )
