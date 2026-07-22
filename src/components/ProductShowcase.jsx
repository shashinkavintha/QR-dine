"use client";

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function ProductShowcase() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const translateY1 = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const translateY2 = useTransform(scrollYProgress, [0, 1], [-150, 150]);

  const menuItems = [
    { e: '🍔', t: 'Classic Burger', p: '$8.99', status: 'Active' },
    { e: '🍕', t: 'Margherita Pizza', p: '$12.50', status: 'Active' },
    { e: '🥗', t: 'Caesar Salad', p: '$7.00', status: 'Active' },
    { e: '🍹', t: 'Tropical Smoothie', p: '$4.50', status: 'Out of Stock' }
  ];

  return (
    <section id="features" ref={containerRef} className="py-24 overflow-hidden bg-white relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center mb-16 relative z-10">
        <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 text-slate-900 tracking-tight">
          A more effective way to manage menus
        </h2>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
          Say goodbye to messy PDFs and outdated printouts. Take full control of your digital dining experience from a powerful, intuitive dashboard.
        </p>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
        
        {/* Decorative Parallax Element 1 (Left) */}
        <motion.div style={{ y: translateY1 }} className="hidden md:block absolute left-[-5%] top-[20%] w-32 h-32 bg-gradient-to-br from-orange-400 to-rose-500 rounded-3xl rotate-12 shadow-2xl opacity-80 z-20"></motion.div>
        
        {/* Decorative Parallax Element 2 (Right) */}
        <motion.div style={{ y: translateY2 }} className="hidden md:block absolute right-[-2%] bottom-[10%] w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full shadow-2xl opacity-80 z-20"></motion.div>

        {/* Feature Grid */}
        <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
              📱
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Dynamic QR Codes</h3>
            <p className="text-slate-500 font-medium">Print once, update anytime. Changes to your menu reflect instantly without ever re-printing a single QR code.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
              ✨
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Beautiful Mobile Menus</h3>
            <p className="text-slate-500 font-medium">Deliver a stunning, app-like dining experience directly in your guests' mobile browsers without any downloads.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
              📈
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Real-time Analytics</h3>
            <p className="text-slate-500 font-medium">Track revenue and popular items live. Make data-driven decisions to boost your restaurant's profitability.</p>
          </div>

        </div>
      </div>
    </section>
  );
}
