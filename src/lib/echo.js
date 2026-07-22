import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Fallback to avoid 'window is not defined' in SSR
if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
}

const getEcho = (token = null) => {
    if (typeof window === 'undefined') return null;

    const config = {
        broadcaster: 'reverb',
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'reverb_key_qr_saas',
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost',
        wsPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
        wssPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
        forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
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
