"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const redirect = searchParams.get('redirect') || '/dashboard';

    if (token) {
      localStorage.setItem('tenant_token', token);
      document.cookie = `tenant_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      router.push(redirect);
    } else {
      router.push('/login?error=google_auth_failed');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
      <h2 className="text-xl font-bold text-slate-800">Authenticating...</h2>
      <p className="text-slate-500 font-medium">Please wait while we log you in securely.</p>
    </div>
  );
}

export default function GoogleAuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
