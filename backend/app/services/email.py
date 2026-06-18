import smtplib
import json
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Sends a 6-digit OTP verification code to the specified email address.
    Logs the OTP to the console for easy retrieval in local development/testing.
    Sends a real email using Resend API (HTTP) if RESEND_API_KEY is configured,
    or falls back to SMTP if SMTP_HOST is configured.
    """
    # Print the OTP to the console logs so developers can see it without SMTP/Resend configured
    print("\n" + "=" * 50)
    print(f" OTP VERIFICATION CODE FOR: {to_email}")
    print(f" CODE: {otp}")
    print(f" Valid for 10 minutes.")
    print("=" * 50 + "\n")

    html_body = f"""
    <html>
        <body style="font-family: 'Outfit', 'Inter', sans-serif; background-color: #030712; color: #f1f5f9; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="background: linear-gradient(to right, #38bdf8, #2563eb); -webkit-background-clip: text; color: transparent; margin: 0; font-size: 24px; font-weight: bold;">
                        Startup Validation Platform
                    </h2>
                </div>
                <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 24px;" />
                <p style="font-size: 16px; line-height: 24px; color: #cbd5e1; margin-bottom: 16px;">
                    Hello,
                </p>
                <p style="font-size: 16px; line-height: 24px; color: #cbd5e1; margin-bottom: 24px;">
                    Thank you for initiating registration. Please use the following 6-digit One-Time Password (OTP) to verify your email address and complete registration. This code will expire in 10 minutes.
                </p>
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px dashed rgba(56, 189, 248, 0.3); padding: 12px 24px; border-radius: 8px;">
                        {otp}
                    </div>
                </div>
                <p style="font-size: 14px; line-height: 20px; color: #64748b;">
                    If you did not request this verification code, you can safely ignore this email.
                </p>
                <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 24px; margin-bottom: 24px;" />
                <p style="font-size: 14px; color: #94a3b8; margin: 0; text-align: center;">
                    &copy; 2026 Startup Validation Platform. All rights reserved.
                </p>
            </div>
        </body>
    </html>
    """

    # 1. Try Resend HTTP API (recommended for Render Free Tier)
    if settings.RESEND_API_KEY:
        print("RESEND_API_KEY configured. Sending via Resend API...")
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Uses settings.RESEND_FROM (defaults to onboarding@resend.dev for free accounts)
        from_email = settings.RESEND_FROM
        
        data = {
            "from": from_email,
            "to": [to_email],
            "subject": f"Your Verification OTP: {otp}",
            "html": html_body
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                print(f"Successfully sent OTP email to {to_email} via Resend API.")
                return True
        except urllib.error.HTTPError as e:
            error_info = e.read().decode("utf-8")
            print(f"Resend API returned HTTP error: {e.code} - {error_info}")
            raise RuntimeError(f"Resend API error: {error_info}")
        except Exception as e:
            print(f"Resend API connection failed: {str(e)}")
            raise RuntimeError(f"Resend connection failed: {str(e)}")

    # 2. Try standard SMTP
    if settings.SMTP_HOST:
        print("SMTP_HOST configured. Sending via SMTP...")
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"Your Verification OTP: {otp}"
            msg["From"] = settings.SMTP_FROM
            msg["To"] = to_email
            msg.attach(MIMEText(html_body, "html"))

            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, [to_email], msg.as_string())
            server.quit()
            print(f"Successfully sent OTP email to {to_email} via SMTP.")
            return True
        except Exception as e:
            print(f"SMTP delivery failed: {str(e)}")
            raise RuntimeError(f"SMTP failed: {str(e)}")

    # 3. If neither is configured
    print("No email service configured (SMTP or Resend). Skipping email transmission.")
    return True

