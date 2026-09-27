"""Pure Cache-Control decision, extracted out of main.py so it can be
unit tested without spinning up the app."""

DYNAMIC_PREFIXES = ("/products", "/drops")


def calcular_cache_control(method: str, path: str, status_code: int) -> str | None:
    """
    Decide el header Cache-Control para una respuesta.
    Devuelve None si la respuesta no debe cachearse (no es GET 200, o es admin).
    """
    if method != "GET" or path.startswith("/admin") or status_code != 200:
        return None

    if any(path.startswith(prefix) for prefix in DYNAMIC_PREFIXES):
        # Products y drops cambian via admin CRUD — nunca dejar que el
        # navegador sirva una version vieja.
        return "no-store"

    return "public, max-age=120, stale-while-revalidate=300"
