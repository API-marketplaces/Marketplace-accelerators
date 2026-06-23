from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from app.core.email import send_support_message

router = APIRouter()


class SupportMessage(BaseModel):
    email: str
    application: str = "MonetizeMate"
    message: str
    attachments: list[str] = []


@router.post("/support/message")
def create_support_message(payload: SupportMessage):
    if "@" not in payload.email or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Valid email and message are required.")

    sent = send_support_message(
        reply_to=payload.email,
        application=payload.application,
        body=payload.message,
        attachments=payload.attachments,
    )

    if not sent:
        print(
            "Support request received:",
            {
                "email": payload.email,
                "application": payload.application,
                "message": payload.message,
                "attachments": payload.attachments,
            },
        )

    return {
        "ok": True,
        "sent": sent,
        "message": "Thanks, your message has been sent to support.",
    }
