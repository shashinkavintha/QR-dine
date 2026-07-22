"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useLenis } from 'lenis/react';

export default function Navbar() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lenis = useLenis();

  const scrollToSection = (id) => {
    if (lenis) {
      lenis.scrollTo(`#${id}`);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-6'}`}>
      <nav className={`mx-auto max-w-7xl px-6 lg:px-8 py-3 transition-all duration-300 flex items-center justify-between ${
        scrolled 
        ? 'bg-white/70 backdrop-blur-lg shadow-lg shadow-slate-200/20 border border-white/50 rounded-full w-[95%] lg:w-full' 
        : 'bg-transparent w-full'
      }`}>
        {/* Logo */}
        <div className="flex items-center gap-2 pt-2 pb-2">
          <img src="/logo.png" alt="QR Dine Logo" className="h-[180px] w-auto max-w-none object-contain drop-shadow-sm hover:scale-110 transition-transform -my-16 scale-110 origin-left" />
        </div>
        
        {/* Desktop Menu */}
        <ul className="hidden lg:flex items-center space-x-10 font-semibold text-slate-600">
          <li>
            <button onClick={() => scrollToSection('features')} className="hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-orange-500 hover:to-rose-500 transition-all">Features</button>
          </li>
          <li>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-orange-500 hover:to-rose-500 transition-all">How it Works</button>
          </li>
          <li>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-orange-500 hover:to-rose-500 transition-all">Pricing</button>
          </li>
          <li>
            <button onClick={() => scrollToSection('contact')} className="hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-orange-500 hover:to-rose-500 transition-all">Contact</button>
          </li>
        </ul>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
            Login
          </Link>
          <Link href="/register" className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 duration-300">
            Start 14-Day Free Trial
          </Link>
        </div>

        {/* Mobile Hamburger Icon */}
        <button 
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 bg-white/50 rounded-full backdrop-blur-sm" onClick={() => setIsNavOpen(!isNavOpen)}>
          {isNavOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Mobile Menu Overlay */}
        {isNavOpen && (
          <div className="absolute top-[80px] left-4 right-4 bg-white/95 backdrop-blur-xl rounded-3xl flex flex-col items-center space-y-6 py-8 shadow-2xl border border-white/50 lg:hidden z-50">
            <button className="text-lg font-bold text-slate-700" onClick={() => { scrollToSection('features'); setIsNavOpen(false); }}>Features</button>
            <button className="text-lg font-bold text-slate-700" onClick={() => { scrollToSection('how-it-works'); setIsNavOpen(false); }}>How it Works</button>
            <button className="text-lg font-bold text-slate-700" onClick={() => { scrollToSection('pricing'); setIsNavOpen(false); }}>Pricing</button>
            <button className="text-lg font-bold text-slate-700" onClick={() => { scrollToSection('contact'); setIsNavOpen(false); }}>Contact</button>
            <div className="flex flex-col w-10/12 gap-4 pt-6 border-t border-gray-200">
              <Link href="/login" className="block w-full text-center py-3 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-50" onClick={() => setIsNavOpen(false)}>
                Login
              </Link>
              <Link href="/register" className="block w-full text-center py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20" onClick={() => setIsNavOpen(false)}>
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
