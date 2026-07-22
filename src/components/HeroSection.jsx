"use client";

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const DummyMenu = ({ layout }) => {
  const items = [
    { e: '🍔', t: 'Classic Burger', p: '$8.99' },
    { e: '🍕', t: 'Margherita Pizza', p: '$12.50' },
    { e: '🥗', t: 'Caesar Salad', p: '$7.00' },
    { e: '🍹', t: 'Tropical Smoothie', p: '$4.50' }
  ];

  return (
    <div className="w-full h-full bg-orange-50 flex flex-col font-sans select-none">
      <div className="bg-orange-500 text-white p-3 md:p-4 shrink-0 shadow-md">
        <h3 className="font-bold text-sm md:text-lg leading-tight">Delicious Bites</h3>
        <p className="text-[10px] md:text-xs opacity-90">Digital Menu</p>
      </div>
      <div className={`flex-1 p-2 md:p-4 overflow-hidden ${layout !== 'mobile' ? 'grid grid-cols-2 gap-2 md:gap-4' : 'space-y-2 md:space-y-4 flex flex-col'}`}>
        {items.map((i, idx) => (
          <div key={idx} className="flex gap-2 md:gap-4 bg-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-50 rounded-lg md:rounded-xl flex items-center justify-center text-2xl md:text-3xl shrink-0">{i.e}</div>
            <div className="flex flex-col justify-between flex-1 py-0.5 md:py-1">
              <h4 className="font-bold text-slate-800 text-xs md:text-sm">{i.t}</h4>
              <div className="flex justify-between items-center mt-1 md:mt-2">
                <span className="font-bold text-orange-600 text-xs md:text-sm">{i.p}</span>
                <span className="bg-orange-50 text-orange-600 px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold">Add</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PhoneMockup = ({ imageUrl }) => (
  <div className="relative z-20 w-[240px] md:w-[280px] h-[480px] md:h-[560px] bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-2 md:p-3 shadow-2xl border-4 border-slate-800 mx-auto">
    <div className="absolute top-0 inset-x-0 h-5 md:h-6 flex justify-center z-20">
      <div className="w-20 md:w-24 h-4 md:h-5 bg-slate-900 rounded-b-2xl"></div>
    </div>
    <div className="w-full h-full bg-white rounded-[2rem] md:rounded-[2.25rem] overflow-hidden relative">
      {imageUrl ? (
        <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${imageUrl}`} alt="Digital Menu" className="w-full h-full object-cover" />
      ) : (
        <DummyMenu layout="mobile" />
      )}
    </div>
  </div>
);

const TabletMockup = ({ imageUrl }) => (
  <div className="relative z-20 w-[380px] md:w-[460px] h-[280px] md:h-[340px] bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-2 md:p-3 shadow-2xl border-4 border-slate-800 mx-auto mt-12 md:mt-20">
    <div className="absolute left-0 inset-y-0 w-6 flex flex-col justify-center items-center z-20">
      <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
    </div>
    <div className="w-full h-full bg-white rounded-[1rem] md:rounded-[1.25rem] overflow-hidden relative">
      {imageUrl ? (
        <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${imageUrl}`} alt="Digital Menu" className="w-full h-full object-cover" />
      ) : (
        <DummyMenu layout="tablet" />
      )}
    </div>
  </div>
);

const LaptopMockup = ({ imageUrl }) => (
  <div className="relative z-20 mx-auto flex flex-col items-center mt-16 md:mt-24">
    <div className="w-[420px] md:w-[600px] h-[260px] md:h-[380px] bg-slate-900 rounded-t-[1rem] md:rounded-t-[1.5rem] p-2 md:p-3 shadow-2xl border-4 border-slate-800 border-b-0">
      <div className="absolute top-1.5 inset-x-0 flex justify-center z-20">
        <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
      </div>
      <div className="w-full h-full bg-white rounded-t-sm overflow-hidden relative mt-0.5 md:mt-1">
        {imageUrl ? (
          <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${imageUrl}`} alt="Digital Menu" className="w-full h-full object-cover" />
        ) : (
          <DummyMenu layout="desktop" />
        )}
      </div>
    </div>
    <div className="w-[480px] md:w-[680px] h-3 md:h-4 bg-slate-300 rounded-b-lg md:rounded-b-2xl shadow-xl border-t border-slate-400 flex justify-center relative">
      <div className="w-20 md:w-32 h-1 md:h-1.5 bg-slate-400 rounded-b-md"></div>
    </div>
  </div>
);

export default function HeroSection() {
  const containerRef = useRef(null);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [heroImages, setHeroImages] = useState({
    phone: null,
    tablet: null,
    laptop: null
  });
  
  useEffect(() => {
    // Fetch public settings on mount
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/public/settings`)
      .then(res => res.json())
      .then(data => {
        setHeroImages({
          phone: data.hero_mockup_image_phone_url || null,
          tablet: data.hero_mockup_image_tablet_url || null,
          laptop: data.hero_mockup_image_laptop_url || null
        });
      })
      .catch(err => console.error("Error fetching public settings:", err));
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, 250]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Cycle through devices (Phone: 0, Tablet: 1, Laptop: 2)
  useEffect(() => {
    const interval = setInterval(() => {
      setDeviceIndex((prev) => (prev + 1) % 3);
    }, 4000); // Change every 4 seconds
    return () => clearInterval(interval);
  }, []);

  const devices = [
    { id: 'phone', component: <PhoneMockup imageUrl={heroImages.phone} /> },
    { id: 'tablet', component: <TabletMockup imageUrl={heroImages.tablet} /> },
    { id: 'laptop', component: <LaptopMockup imageUrl={heroImages.laptop} /> },
  ];

  return (
    <section ref={containerRef} id="home" className="relative pt-32 pb-28 lg:pt-48 lg:pb-40 overflow-hidden bg-[#F8FAFC]">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-tr from-orange-400/30 to-amber-300/30 blur-[120px] pointer-events-none mix-blend-multiply"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative z-10">
        
        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left pt-6 lg:pt-0 z-20">
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-[5rem] font-extrabold tracking-tight mb-8 leading-[1.1]"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700">Smart QR Menus for </span>
            <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Modern Restaurants</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
          >
            Digitize your menu in seconds with zero printing costs. Create a contactless, engaging digital dining experience today.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start"
          >
            <Link 
              href="/register"
              className="group relative px-8 py-4 bg-slate-900 rounded-full font-bold text-lg text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Get Started for Free</span>
            </Link>
            <Link 
              href="#contact"
              className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 shadow-sm"
            >
              Book a Demo
            </Link>
          </motion.div>
        </div>

        {/* Right Content - Animated Devices with Parallax Icons */}
        <motion.div style={{ opacity }} className="flex-1 w-full relative pt-12 lg:pt-0 flex justify-center items-center h-[500px] lg:h-[600px] z-10">
          
          {/* Animated Mockup Carousel */}
          <div className="relative w-full h-full flex justify-center items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={deviceIndex}
                initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute"
                style={{ perspective: '1000px' }}
              >
                {devices[deviceIndex].component}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Parallax Floating Icons */}
          <motion.div style={{ y: y1 }} className="absolute -left-10 md:left-[10%] top-[20%] z-30 drop-shadow-2xl text-5xl md:text-6xl bg-white p-3 md:p-4 rounded-3xl rotate-12 shadow-xl border border-gray-100">
            🍕
          </motion.div>
          <motion.div style={{ y: y2 }} className="absolute -right-8 md:right-[5%] top-[35%] z-30 drop-shadow-2xl text-5xl md:text-6xl bg-white p-3 md:p-4 rounded-3xl -rotate-12 shadow-xl border border-gray-100">
            ☕
          </motion.div>
          <motion.div style={{ y: y3 }} className="absolute left-[15%] md:left-[25%] bottom-[15%] z-30 drop-shadow-2xl text-4xl md:text-5xl bg-orange-100 p-3 md:p-4 rounded-3xl rotate-45 shadow-xl border border-orange-200">
            ⭐
          </motion.div>
          <motion.div style={{ y: y4 }} className="absolute right-[10%] md:right-[20%] bottom-[5%] z-10 drop-shadow-2xl text-4xl md:text-5xl bg-white p-3 md:p-4 rounded-full -rotate-45 shadow-xl border border-gray-100">
            🥗
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
