"""Pure database URL normalization, extracted out of database.py so it can be
unit tested without creating an engine."""

POSTGRES_DRIVER_SCHEME = "postgresql+psycopg://"
GENERIC_POSTGRES_SCHEMES = ("postgresql://", "postgres://")


def normalize_database_url(url: str) -> str:
    """
    Make a provider-style Postgres URL (Neon, Render, Railway...) usable by SQLAlchemy.

    Providers hand out postgresql:// or postgres://, which SQLAlchemy resolves to
    the psycopg2 driver. We ship psycopg 3, so the scheme names it explicitly.
    URLs that already name a driver are returned untouched.
    """
    for scheme in GENERIC_POSTGRES_SCHEMES:
        if url.startswith(scheme):
            return POSTGRES_DRIVER_SCHEME + url[len(scheme):]
    return url
