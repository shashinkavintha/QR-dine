"use client";

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Store, Link as LinkIcon, ArrowRight, Loader2 } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    restaurant_name: '',
    slug: ''
  });

  const handleSlugGen = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      restaurant_name: name,
      slug: handleSlugGen(name)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);

    try {
      // In a real app, you'd replace this with your actual API URL
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token
        localStorage.setItem('tenant_token', data.access_token);
        document.cookie = `tenant_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
        
        const redirectUrl = searchParams.get('redirect') || '/onboarding';
        router.push(redirectUrl);
      } else {
        let errorMsg = data.message || data.error || 'Registration failed. Please try again.';
        if (response.status === 422 && typeof data === 'object') {
          // Laravel validation errors are sometimes returned directly as an object of arrays
          const firstErrorKey = Object.keys(data)[0];
          if (firstErrorKey && Array.isArray(data[firstErrorKey])) {
            errorMsg = data[firstErrorKey][0];
          }
        }
        alert(errorMsg);
      }
    } catch (error) {
      console.error(error);
      alert('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    // Redirect to Laravel Socialite Google endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/auth/google/redirect`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-8">
        
        <div className="mb-8 text-center flex flex-col items-center">
          <Link href="/" className="inline-flex flex-col items-center mb-6 group">
            <img src="/logo.png" alt="QR Dine Logo" className="h-[150px] sm:h-[180px] w-auto max-w-[400px] object-contain group-hover:scale-105 transition-transform -my-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h1>
          <p className="text-slate-500 text-sm">Start your 14-day free trial. No credit card required.</p>
        </div>

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name</label>
              <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" placeholder="John" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name</label>
              <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" placeholder="Doe" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" placeholder="john@example.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <input required type="password" value={formData.password_confirmation} onChange={e => setFormData({...formData, password_confirmation: e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" placeholder="••••••••" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Restaurant Name</label>
            <input required type="text" value={formData.restaurant_name} onChange={handleNameChange} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" placeholder="Grand Plaza Hotel" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Menu Link (URL Slug)</label>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 transition-all">
              <div className="bg-slate-50 px-3 py-2 text-sm text-slate-500 flex items-center border-r border-slate-200">
                qrmenu.com/
              </div>
              <input required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: handleSlugGen(e.target.value)})} className="w-full bg-white px-3 py-2 text-sm text-slate-900 outline-none" placeholder="grand-plaza" />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="terms" className="text-sm text-slate-600 leading-tight">
              I agree to the <Link href="/terms" className="text-slate-900 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-slate-900 hover:underline">Privacy Policy</Link>.
            </label>
          </div>

          <button disabled={loading || !termsAccepted} type="submit" className="w-full bg-slate-900 text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <Link href="/login" className="text-slate-900 hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
