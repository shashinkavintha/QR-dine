"use client";

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MessageCircle, ArrowDown } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const [bgImage, setBgImage] = useState("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/system-settings/public`);
        if (res.ok) {
          const data = await res.json();
          if (data.hero_bg_image) {
            const imageUrl = data.hero_bg_image.startsWith('http') 
              ? data.hero_bg_image 
              : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${data.hero_bg_image}`;
            setBgImage(imageUrl);
          }
        }
      } catch (e) {
        console.error("Failed to fetch public settings for hero bg", e);
      }
    };
    fetchSettings();
  }, []);

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <section ref={containerRef} id="home" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden min-h-screen flex items-center">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Restaurant background" 
          className="w-full h-full object-cover object-right"
        />
      </div>

      {/* Gradient Overlay: White on the left, fading to transparent on the right */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b lg:bg-gradient-to-r from-white via-white/95 to-white/30 lg:to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
        
        {/* Content */}
        <div className="max-w-3xl text-center lg:text-left pt-12 lg:pt-24">
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[2.5rem] md:text-5xl lg:text-[4rem] font-extrabold tracking-tight mb-6 leading-[1.1] text-slate-900"
          >
            Scan. Browse. Order.
            <br />
            <span className="text-orange-500">It's That Simple.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
          >
            Transform your paper menu into a digital experience — The most affordable QR menu solution for modern restaurants.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-12"
          >
            <a 
              href="https://wa.me/message/ARCK6UNOW4DRF1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-3.5 bg-orange-500 rounded-full font-bold text-base md:text-lg text-white hover:bg-orange-600 transition-colors shadow-md"
            >
              <MessageCircle size={20} />
              Chat with Us
            </a>
            <Link 
              href="#how-it-works"
              className="flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-base md:text-lg text-orange-500 bg-white border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50 transition-colors shadow-sm"
            >
              See It In Action
              <ArrowDown size={20} />
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="inline-block bg-slate-50 border border-slate-100 rounded-full px-6 py-3 shadow-sm"
          >
            <p className="text-sm md:text-base text-slate-600 font-medium">
              Empowering <span className="text-orange-500 font-bold">Small to Top-Tier</span> Restaurants globally
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
