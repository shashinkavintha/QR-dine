<!DOCTYPE html>
<html>
<head>
    <title>Bank Transfer Status Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-w: 600px; margin: 0 auto; padding: 20px;">
        <h2>Bank Transfer Status Update</h2>
        <p>Hello {{ $transaction->user->first_name }},</p>
        
        <p>Your recent bank transfer for <strong>LKR {{ number_format($transaction->amount, 2) }}</strong> has been reviewed.</p>
        
        <div style="margin: 20px 0; padding: 15px; border-radius: 5px; background-color: {{ $transaction->status === 'completed' ? '#dcfce7' : '#fee2e2' }}; color: {{ $transaction->status === 'completed' ? '#166534' : '#991b1b' }}; border: 1px solid {{ $transaction->status === 'completed' ? '#bbf7d0' : '#fecaca' }};">
            <strong>Status: {{ ucfirst($transaction->status) }}</strong>
        </div>
        
        @if($transaction->status === 'completed')
            <p>Your payment has been verified and your subscription is now active! You can start using all the features of your plan.</p>
            <p style="margin-top: 30px;">
                <a href="{{ config('app.frontend_url') }}/dashboard" style="background-color: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Go to Dashboard
                </a>
            </p>
        @else
            <p>Unfortunately, we could not verify your payment. Please check your uploaded receipt and try again, or contact our support team for assistance.</p>
        @endif
        
        <p style="margin-top: 40px; font-size: 14px; color: #666;">
            Thank you for choosing QR Dine!
        </p>
    </div>
</body>
</html>
