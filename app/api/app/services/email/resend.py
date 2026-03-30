import resend
from app.config import settings

resend.api_key = settings.resend_api_key


async def send_welcome_email(to_email: str, name: str) -> None:
    if not settings.resend_api_key:
        return
    resend.Emails.send({
        "from": "MyTravel <hello@mytravel.app>",
        "to": to_email,
        "subject": "Welcome to MyTravel",
        "html": f"""
        <h1>Hi {name},</h1>
        <p>Welcome to MyTravel! You're ready to generate your first AI-powered itinerary.</p>
        <p><a href="{settings.frontend_url}/trips/new">Plan your first trip →</a></p>
        <p>You have 3 free itinerary generations this month. Enjoy!</p>
        """,
    })


async def send_password_reset_email(to_email: str, name: str, token: str) -> None:
    if not settings.resend_api_key:
        return
    reset_url = f"{settings.frontend_url}/reset-password?token={token}"
    resend.Emails.send({
        "from": "MyTravel <hello@mytravel.app>",
        "to": to_email,
        "subject": "Reset your MyTravel password",
        "html": f"""
        <h1>Hi {name},</h1>
        <p>Click below to reset your password. This link expires in 1 hour.</p>
        <p><a href="{reset_url}">Reset password →</a></p>
        <p>If you didn't request this, ignore this email.</p>
        """,
    })
