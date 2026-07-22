"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('tenant_token', data.access_token);
        document.cookie = `tenant_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
        
        // Role-based redirect
        const role = data.user?.role;
        if (role === 'super_admin') {
          router.push('/super-admin');
        } else {
          // Check if onboarding is needed - go to onboarding for new-ish users
          const redirectUrl = searchParams.get('redirect') || '/dashboard';
          router.push(redirectUrl);
        }
      } else {
        setErrorMsg(data.error || 'Invalid credentials. Please check your email and password.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/auth/google/redirect`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-8">
        
        <div className="mb-8 text-center flex flex-col items-center">
          <Link href="/" className="inline-flex flex-col items-center mb-6 group">
            <img src="/logo.png" alt="QR Dine Logo" className="h-[150px] sm:h-[180px] w-auto max-w-[400px] object-contain group-hover:scale-105 transition-transform -my-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-500 text-sm">Sign in to your account</p>
        </div>

        {searchParams && searchParams.get('error') === 'suspended' && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3">
            <div className="text-rose-500 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <h3 className="font-semibold text-rose-800 text-sm">Account Suspended</h3>
              <p className="text-rose-600 text-xs mt-1">Please contact support.</p>
            </div>
          </div>
        )}
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3">
            <div className="text-rose-500 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <h3 className="font-semibold text-rose-800 text-sm">Login Failed</h3>
              <p className="text-rose-600 text-xs mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        <button 
          onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-semibold text-sm py-2.5 rounded-lg hover:bg-slate-50 transition-all shadow-sm mb-6"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-slate-100 flex-1"></div>
          <span className="text-xs text-slate-400">OR</span>
          <div className="h-px bg-slate-100 flex-1"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" placeholder="john@example.com" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">Forgot password?</Link>
            </div>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" placeholder="••••••••" />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account? <Link href="/register" className="text-slate-900 hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
