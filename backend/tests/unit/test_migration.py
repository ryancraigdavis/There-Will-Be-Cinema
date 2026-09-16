import pytest

from cinema.db.connection import ADDED_COLUMNS, connect


def columns(conn) -> set[str]:
    return {row["name"] for row in conn.execute("PRAGMA table_info(items)")}


@pytest.mark.parametrize("column", sorted(ADDED_COLUMNS), ids=sorted(ADDED_COLUMNS))
def test_missing_columns_are_added_on_open(data_dir, column):
    first = connect(data_dir)
    first.execute(f"ALTER TABLE items DROP COLUMN {column}")
    first.commit()
    assert column not in columns(first)
    first.close()

    second = connect(data_dir)
    assert column in columns(second)
    second.close()
