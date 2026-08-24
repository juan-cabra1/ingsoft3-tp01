"""
Security headers middleware — adds common security headers to all responses.
No external dependencies required.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds standard security headers to every response:
    - X-Content-Type-Options: prevents MIME sniffing
    - X-Frame-Options: prevents clickjacking
    - X-XSS-Protection: legacy XSS protection
    - Strict-Transport-Security: forces HTTPS
    - Referrer-Policy: limits referrer info leakage
    - Permissions-Policy: restricts browser features
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        return response
