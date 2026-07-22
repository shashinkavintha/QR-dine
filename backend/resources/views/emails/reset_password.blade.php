<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #0f172a; padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
        .content h2 { color: #0f172a; font-size: 20px; margin-top: 0; }
        .btn { display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 14px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MenuLanka</h1>
        </div>
        <div class="content">
            <h2>Hello {{ $userName }},</h2>
            <p>You are receiving this email because we received a password reset request for your account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $resetLink }}" class="btn">Reset Password</a>
            </div>

            <p>This password reset link will expire in 60 minutes.</p>
            <p>If you did not request a password reset, no further action is required.</p>
            
            <p>Best regards,<br>The MenuLanka Team</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} MenuLanka. All rights reserved.
        </div>
    </div>
</body>
</html>
