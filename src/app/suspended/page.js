"use client";

import { Ban } from 'lucide-react';
import Link from 'next/link';

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 selection:bg-orange-500 selection:text-white">
      <div className="max-w-md w-full bg-white p-10 rounded-[2rem] shadow-xl text-center border border-slate-100">
        <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Ban size={40} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 mb-3">Menu Unavailable</h1>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          This menu is currently unavailable. The restaurant might be offline or their account is suspended.
        </p>
        <Link 
          href="/"
          className="inline-flex justify-center bg-slate-900 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all w-full"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
