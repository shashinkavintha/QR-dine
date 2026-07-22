<!DOCTYPE html>
<html>
<head>
    <title>New Bank Transfer Uploaded</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-w: 600px; margin: 0 auto; padding: 20px;">
        <h2>New Bank Transfer Needs Approval</h2>
        <p>A new bank transfer receipt has been uploaded by a user and is waiting for your approval.</p>
        
        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Transaction ID:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{ $transaction->transaction_id }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">LKR {{ number_format($transaction->amount, 2) }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>User:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{ $transaction->user->first_name }} {{ $transaction->user->last_name }} ({{ $transaction->user->email }})</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{ $transaction->created_at->format('Y-m-d H:i') }}</td>
            </tr>
        </table>
        
        <p style="margin-top: 30px;">
            <a href="{{ config('app.frontend_url') }}/super-admin/bank-transfers" style="background-color: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Review in Dashboard
            </a>
        </p>
    </div>
</body>
</html>
