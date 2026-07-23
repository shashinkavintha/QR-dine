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
    <section ref={containerRef} className="py-16 md:py-20 px-6 lg:px-12 bg-slate-50 relative overflow-hidden border-t border-slate-100">
      
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
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight leading-tight">
          Ready to digitize your restaurant? <br className="hidden md:block"/> Sign up for free today.
        </h2>
        <p className="text-base md:text-lg text-slate-600 mb-8 max-w-2xl mx-auto font-medium">
          Join the modern restaurants that are boosting sales and saving time. No credit card required.
        </p>
        <Link 
          href="/register"
          className="inline-block px-10 py-4 bg-orange-500 rounded-full font-bold text-lg md:text-xl text-white hover:bg-orange-600 transition-all shadow-md hover:shadow-lg"
        >
          Sign up for free today
        </Link>
      </div>
    </section>
  );
}
