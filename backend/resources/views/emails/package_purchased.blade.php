<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Thank You for Choosing MenuLanka!</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #0f172a; padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
        .content h2 { color: #0f172a; font-size: 20px; margin-top: 0; }
        .plan-box { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #f97316; }
        .plan-box p { margin: 8px 0; }
        .plan-box strong { color: #0f172a; }
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
            <h2>Hello {{ $user->name }},</h2>
            <p>Thank you for your purchase! We are thrilled to have you on board. Your subscription has been successfully processed and your account is now fully active.</p>
            
            <div class="plan-box">
                <p><strong>Package Details:</strong></p>
                <p>Plan Name: <strong>{{ $plan->name }}</strong></p>
                <p>Amount Paid: <strong>LKR {{ number_format($plan->price, 2) }}</strong></p>
                <p>Expires On: <strong>{{ \Carbon\Carbon::parse($expiresAt)->format('d M Y, h:i A') }}</strong></p>
            </div>

            <p>You can now log in to your dashboard and manage your QR menus seamlessly.</p>
            
            <p>If you have any questions or need assistance, feel free to contact our support team.</p>
            
            <p>Best regards,<br>The MenuLanka Team</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} MenuLanka. All rights reserved.
        </div>
    </div>
</body>
</html>
