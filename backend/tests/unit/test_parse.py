import pytest

from cinema.emby.parse import flatten_item, parse_audio_stream, parse_video_stream


@pytest.mark.parametrize(
    ("stream", "hdr", "profile", "is_4k"),
    [
        pytest.param(
            {"Width": 1920, "VideoRange": "SDR", "ExtendedVideoType": "None"},
            "SDR",
            None,
            False,
            id="sdr",
        ),
        pytest.param(
            {"Width": 3840, "VideoRange": "HDR 10", "ExtendedVideoType": "Hdr10"},
            "HDR10",
            None,
            True,
            id="hdr10",
        ),
        pytest.param(
            {"Width": 3840, "ExtendedVideoType": "Hdr10Plus"}, "HDR10+", None, True, id="hdr10plus"
        ),
        pytest.param({"Width": 1920, "ExtendedVideoType": "Hlg"}, "HLG", None, False, id="hlg"),
        pytest.param(
            {"Width": 3840, "ExtendedVideoType": "None", "ColorTransfer": "smpte2084"},
            "HDR10",
            None,
            True,
            id="hdr-by-transfer",
        ),
        pytest.param(
            {
                "Width": 3840,
                "VideoRange": "DolbyVision",
                "ExtendedVideoType": "DolbyVision",
                "ExtendedVideoSubType": "DoviProfile76",
            },
            "Dolby Vision",
            "7.6",
            True,
            id="dv-7.6",
        ),
        pytest.param(
            {
                "Width": 3840,
                "ExtendedVideoType": "DolbyVision",
                "ExtendedVideoSubType": "DoviProfile81",
            },
            "Dolby Vision",
            "8.1",
            True,
            id="dv-8.1",
        ),
        pytest.param(
            {
                "Width": 1920,
                "ExtendedVideoType": "DolbyVision",
                "ExtendedVideoSubType": "DoviProfile5",
            },
            "Dolby Vision",
            "5",
            False,
            id="dv-5",
        ),
        pytest.param({}, "SDR", None, False, id="empty"),
    ],
)
def test_parse_video_stream(stream, hdr, profile, is_4k):
    video = parse_video_stream(stream)
    assert (video.hdr_type, video.dv_profile, video.is_4k) == (hdr, profile, is_4k)


@pytest.mark.parametrize(
    ("stream", "atmos", "dtsx", "lossless"),
    [
        pytest.param(
            {"Codec": "truehd", "Profile": "Dolby TrueHD + Dolby Atmos"},
            True,
            False,
            True,
            id="atmos",
        ),
        pytest.param({"Codec": "dts", "Profile": "DTS:X"}, False, True, False, id="dtsx"),
        pytest.param({"Codec": "dts", "Profile": "DTS-HD MA"}, False, False, True, id="dts-hd-ma"),
        pytest.param(
            {"Codec": "eac3", "DisplayTitle": "DD+ Atmos"},
            True,
            False,
            False,
            id="ddplus-atmos-title",
        ),
        pytest.param({"Codec": "aac"}, False, False, False, id="aac"),
    ],
)
def test_parse_audio_stream(stream, atmos, dtsx, lossless):
    audio = parse_audio_stream(stream)
    assert (audio.is_atmos, audio.is_dts_x, audio.is_lossless) == (atmos, dtsx, lossless)


def test_flatten_movie(emby_items):
    row = flatten_item(emby_items[0])
    assert row.id == "m1"
    assert row.runtime_min == 158
    assert row.primary_genre == "Drama"
    assert row.provider_ids == {"Imdb": "tt0469494", "Tmdb": "7345"}
    assert row.image_tag == "tag-m1"
    assert (row.is_4k, row.hdr_format, row.dv_profile) == (True, "Dolby Vision", "7.6")
    assert (row.has_atmos, row.has_dtsx) == (True, False)
    assert row.audio_codec_summary == "TrueHD Atmos 7.1"


def test_flatten_no_media(emby_items):
    row = flatten_item(emby_items[2])
    assert row.primary_genre == "Uncategorized"
    assert row.image_tag is None
    assert (row.is_4k, row.hdr_format, row.audio_codec_summary) == (False, None, None)


def test_flatten_series(emby_items):
    row = flatten_item(emby_items[3])
    assert (row.type, row.child_count, row.primary_genre) == ("Series", 30, "Mystery")


def test_flatten_keeps_file_details(emby_items):
    row = flatten_item(emby_items[0])
    assert (row.width, row.height) == (3840, 2160)
    assert row.file_size == 50000000000
    assert (row.container, row.video_codec) == ("mkv", "hevc")
