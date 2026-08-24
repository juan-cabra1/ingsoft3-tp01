"""
Debug router — receives frontend error reports and logs them to stdout (Railway).
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel
from logging_config import get_logger

router = APIRouter(prefix="/debug", tags=["debug"])
logger = get_logger("frontend_errors")


class FrontendErrorReport(BaseModel):
    message: str
    source: str = ""
    line: int | None = None
    col: int | None = None
    stack: str = ""
    url: str = ""
    user_agent: str = ""


@router.post("/report-error")
async def report_frontend_error(report: FrontendErrorReport, request: Request):
    """Log a frontend error as structured JSON in Railway."""
    request_id = request.headers.get("X-Request-ID", "unknown")
    logger.error(
        f"FRONTEND_ERROR: {report.message}",
        extra={
            "request_id": request_id,
            "extra_data": {
                "event": "frontend_error",
                "source": report.source,
                "line": report.line,
                "col": report.col,
                "stack": report.stack[:2000] if report.stack else "",
                "url": report.url,
                "user_agent": report.user_agent[:200] if report.user_agent else "",
            },
        },
    )
    return {"status": "received"}
