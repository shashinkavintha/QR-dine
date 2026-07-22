"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ChefHat, ArrowLeft, Loader2, CheckCircle2, Lock, KeyRound } from 'lucide-react';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/forgot-password/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (res.status === 429) {
        setError('Too many attempts. Please wait a minute before trying again.');
        return;
      }

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'OTP sent successfully!');
        setStep(2);
      } else {
        setError(data.error || data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 & 3: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/forgot-password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          otp, 
          new_password: password, 
          new_password_confirmation: passwordConfirm 
        })
      });

      if (res.status === 429) {
        setError('Too many attempts. Please try again later.');
        return;
      }

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Password reset successfully!');
        setStep(3); // Show success screen
      } else {
        setError(data.error || data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center mb-6">
            <img src="/logo.png" alt="QR Dine Logo" className="h-[150px] sm:h-[180px] w-auto max-w-[400px] object-contain -my-4" />
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Reset Password</h1>
          <p className="text-slate-500">
            {step === 1 && "Enter your email and we'll send you an OTP."}
            {step === 2 && "Enter the OTP sent to your email to reset password."}
            {step === 3 && "You're all set!"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100 text-center">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50/50"
                  placeholder="admin@hotel.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">6-Digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50/50 text-center tracking-[0.5em] text-lg font-mono font-bold"
                  placeholder="000000"
                  maxLength="6"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50/50"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50/50"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || !password || !passwordConfirm}
                className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all disabled:opacity-70 flex justify-center items-center shadow-md shadow-orange-500/20"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Success!</h2>
              <p className="text-slate-500 mb-6">Your password has been reset successfully. You can now log in with your new password.</p>
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>

        {step !== 3 && (
          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
