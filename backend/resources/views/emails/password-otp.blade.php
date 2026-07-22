<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your OTP Code</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px; text-align: center;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #64748b; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            We received a request to change the password for your account. Please use the following One-Time Password (OTP) to verify your request. This code will expire in 10 minutes.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f97316;">{{ $otp }}</span>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            If you did not request a password change, please ignore this email or contact support.
        </p>
    </div>
</body>
</html>
