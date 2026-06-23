from email.message import EmailMessage
import smtplib

from app.core.config import settings


def send_password_reset_link(to_email: str, reset_link: str) -> bool:
    """
    Sends a password reset link when SMTP is configured.
    Returns False in local/dev setups without SMTP so callers can log the link.
    """
    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        return False

    message = EmailMessage()
    message["Subject"] = "Reset your MonetizeMate password"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message.set_content(
        "Use this secure link to reset your MonetizeMate password:\n\n"
        f"{reset_link}\n\n"
        f"This link expires in {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes."
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(message)

    return True


def send_support_message(reply_to: str, application: str, body: str, attachments: list[str] | None = None) -> bool:
    """
    Sends a support message when SMTP is configured.
    Returns False in local/dev setups without SMTP so callers can log the request.
    """
    support_email = settings.SUPPORT_EMAIL or settings.SMTP_FROM_EMAIL
    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL or not support_email:
        return False

    message = EmailMessage()
    message["Subject"] = f"MonetizeMate support request: {application}"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = support_email
    message["Reply-To"] = reply_to
    message.set_content(
        "A MonetizeMate user submitted a support request.\n\n"
        f"Email: {reply_to}\n"
        f"Application: {application}\n"
        f"Attachments: {', '.join(attachments or []) or 'None'}\n\n"
        f"Message:\n{body}"
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(message)

    return True
