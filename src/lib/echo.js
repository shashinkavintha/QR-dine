import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Fallback to avoid 'window is not defined' in SSR
if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
}

const getEcho = (token = null) => {
    if (typeof window === 'undefined') return null;

    const isPusher = process.env.NEXT_PUBLIC_BROADCAST_DRIVER === 'pusher';
    
    const config = {
        broadcaster: isPusher ? 'pusher' : 'reverb',
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'reverb_key_qr_saas',
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'ap2',
        wsHost: isPusher ? undefined : (process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost'),
        wsPort: isPusher ? undefined : (process.env.NEXT_PUBLIC_REVERB_PORT || 8080),
        wssPort: isPusher ? undefined : (process.env.NEXT_PUBLIC_REVERB_PORT || 8080),
        forceTLS: isPusher ? true : ((process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https'),
        enabledTransports: ['ws', 'wss'],
    };

    config.authEndpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/broadcasting/auth`;

    if (token) {
        config.auth = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    }

    return new Echo(config);
};

export default getEcho;
