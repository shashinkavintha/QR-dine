"use client";

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';

export default function BottomCTA() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const translateYLeft = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const translateYRight = useTransform(scrollYProgress, [0, 1], [-80, 80]);
  const rotateLeft = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const rotateRight = useTransform(scrollYProgress, [0, 1], [45, 0]);

  return (
    <section ref={containerRef} className="py-16 md:py-20 px-6 lg:px-12 bg-slate-900 relative overflow-hidden">
      
      {/* Decorative Parallax Background Elements */}
      <motion.div 
        style={{ y: translateYLeft, rotate: rotateLeft }} 
        className="absolute left-[-2%] top-[10%] w-48 h-48 border-[30px] border-orange-500/10 rounded-full opacity-50 pointer-events-none"
      ></motion.div>
      <motion.div 
        style={{ y: translateYRight, rotate: rotateRight }} 
        className="absolute right-[-2%] bottom-[5%] w-56 h-56 border-[40px] border-blue-500/10 rounded-3xl opacity-50 pointer-events-none"
      ></motion.div>

      <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-white tracking-tight leading-tight">
          Ready to digitize your restaurant? <br className="hidden md:block"/> Sign up for free today.
        </h2>
        <p className="text-base md:text-lg text-slate-400 mb-8 max-w-2xl mx-auto font-medium">
          Join the modern restaurants that are boosting sales and saving time. No credit card required.
        </p>
        <Link 
          href="/register"
          className="group relative inline-block px-10 py-5 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full font-bold text-xl text-white shadow-[0_0_50px_-10px_rgba(249,115,22,0.6)] hover:shadow-[0_0_80px_-15px_rgba(249,115,22,0.8)] hover:scale-105 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <span className="relative z-10">Sign up for free today</span>
        </Link>
      </div>
    </section>
  );
}
