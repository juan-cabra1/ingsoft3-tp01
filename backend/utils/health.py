"""Pure /health payload, extracted out of main.py so it can be unit tested
without spinning up the app or a database."""

UNKNOWN_COMMIT = "unknown"


def build_health_payload(db_ok: bool, uptime_seconds: int, commit: str, version: str) -> dict:
    """
    Describe the running instance: liveness, database reachability and the commit
    it was built from. The commit is what lets a deploy smoke test prove that the
    NEW version is the one answering, and not the previous one still serving
    while the new build runs.
    """
    return {
        "status": "healthy" if db_ok else "degraded",
        "version": version,
        "commit": commit or UNKNOWN_COMMIT,
        "uptime_seconds": uptime_seconds,
        "database": "connected" if db_ok else "unreachable",
    }
