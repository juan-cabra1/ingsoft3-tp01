"""
Request tracing middleware — assigns a unique X-Request-ID to every request.
Logs method, path, status code, duration, client IP, and user agent.
"""

import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from logging_config import get_logger

logger = get_logger("request")


class RequestTracingMiddleware(BaseHTTPMiddleware):
    """
    Adds correlation ID and structured logging to every request.
    - Generates X-Request-ID (or propagates from client header)
    - Logs request start and completion with duration
    - Adds X-Request-ID to response headers for client-side correlation
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Generate or propagate request ID
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
        start_time = time.time()

        # Extract client info
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("User-Agent", "unknown")[:100]
        method = request.method
        path = request.url.path

        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)

            # Log the completed request
            logger.info(
                f"{method} {path} → {response.status_code} ({duration_ms}ms)",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "path": path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                    "client_ip": client_ip,
                    "user_agent": user_agent,
                },
            )

            # Add correlation headers to response
            response.headers["X-Request-ID"] = request_id
            return response

        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                f"{method} {path} → ERROR ({duration_ms}ms): {exc}",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "path": path,
                    "status_code": 500,
                    "duration_ms": duration_ms,
                    "client_ip": client_ip,
                    "user_agent": user_agent,
                },
                exc_info=True,
            )
            raise
