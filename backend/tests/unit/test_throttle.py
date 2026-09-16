import pytest

from cinema.club.throttle import LoginThrottle, TooManyAttempts

KEYS = ["ip:1.2.3.4", "user:ryan"]


@pytest.fixture
def throttle() -> LoginThrottle:
    return LoginThrottle(limit=3, window=60.0)


def test_allows_attempts_under_the_limit(throttle):
    throttle.fail(KEYS, 0.0)
    throttle.fail(KEYS, 1.0)
    throttle.check(KEYS, 2.0)


def test_blocks_at_the_limit(throttle):
    for at in (0.0, 1.0, 2.0):
        throttle.fail(KEYS, at)
    with pytest.raises(TooManyAttempts):
        throttle.check(KEYS, 3.0)


@pytest.mark.parametrize(
    "keys",
    [pytest.param(["ip:1.2.3.4"], id="same-address"), pytest.param(["user:ryan"], id="same-user")],
)
def test_either_key_trips_the_limit(throttle, keys):
    for at in (0.0, 1.0, 2.0):
        throttle.fail(KEYS, at)
    with pytest.raises(TooManyAttempts):
        throttle.check(keys, 3.0)


def test_failures_age_out(throttle):
    for at in (0.0, 1.0, 2.0):
        throttle.fail(KEYS, at)
    throttle.check(KEYS, 62.5)


def test_success_clears_the_count(throttle):
    for at in (0.0, 1.0, 2.0):
        throttle.fail(KEYS, at)
    throttle.clear(KEYS)
    throttle.check(KEYS, 3.0)
