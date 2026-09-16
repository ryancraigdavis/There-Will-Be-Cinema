from pydantic import BaseModel, Field


class VideoStream(BaseModel, frozen=True):
    codec: str | None = None
    width: int | None = None
    height: int | None = None
    bit_depth: int | None = None
    hdr_type: str = "SDR"
    dv_profile: str | None = None
    is_4k: bool = False


class AudioStream(BaseModel, frozen=True):
    codec: str | None = None
    profile: str | None = None
    channels: int | None = None
    channel_layout: str | None = None
    language: str | None = None
    is_default: bool = False
    is_atmos: bool = False
    is_dts_x: bool = False
    is_lossless: bool = False


class MediaInfo(BaseModel, frozen=True):
    container: str | None = None
    file_size: int | None = None
    video: VideoStream | None = None
    audio_streams: list[AudioStream] = Field(default_factory=list)
    primary_audio: AudioStream | None = None


class ItemRow(BaseModel, frozen=True):
    id: str
    type: str
    title: str
    sort_title: str
    year: int | None = None
    overview: str | None = None
    runtime_min: int | None = None
    community_rating: float | None = None
    official_rating: str | None = None
    genres: list[str] = Field(default_factory=list)
    primary_genre: str = "Uncategorized"
    tags: list[str] = Field(default_factory=list)
    provider_ids: dict[str, str] = Field(default_factory=dict)
    date_created: str | None = None
    date_last_saved: str | None = None
    image_tag: str | None = None
    is_4k: bool = False
    hdr_format: str | None = None
    dv_profile: str | None = None
    has_atmos: bool = False
    has_dtsx: bool = False
    audio_codec_summary: str | None = None
    width: int | None = None
    height: int | None = None
    file_size: int | None = None
    container: str | None = None
    video_codec: str | None = None
    child_count: int | None = None


class CollectionRow(BaseModel, frozen=True):
    id: str
    name: str
    overview: str | None = None
    image_tag: str | None = None
    item_ids: list[str] = Field(default_factory=list)


class EmbyUser(BaseModel, frozen=True):
    id: str
    name: str
