"use client";

import { UtensilsCrossed, QrCode, CheckCircle2 } from 'lucide-react';

const DummyMenu = ({ layout }) => {
  const items = [
    { id: 1, emoji: '🍔', title: 'Classic Burger', desc: 'Beef patty, cheese, lettuce, tomato with our special house sauce.', price: '$8.99' },
    { id: 2, emoji: '🍕', title: 'Margherita Pizza', desc: 'Fresh mozzarella, tomatoes, and basil on a crispy crust.', price: '$12.50' },
    { id: 3, emoji: '🥗', title: 'Caesar Salad', desc: 'Crisp romaine, parmesan, croutons, and Caesar dressing.', price: '$7.00' },
    { id: 4, emoji: '🍹', title: 'Tropical Smoothie', desc: 'Mango, pineapple, and passion fruit blend.', price: '$4.50' },
  ];

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col font-sans select-none">
      {/* Header */}
      <div className="bg-orange-500 text-white p-3 md:p-4 shrink-0 flex justify-between items-center shadow-md z-10 relative">
        <div>
          <h3 className="font-bold text-sm md:text-lg leading-tight">Delicious Bites</h3>
          <p className="text-[10px] md:text-xs opacity-90">Digital Menu</p>
        </div>
        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex justify-center items-center backdrop-blur-sm">
          <UtensilsCrossed size={16} className="md:w-5 md:h-5" />
        </div>
      </div>
      
      {/* Items Container */}
      <div className={`flex-1 overflow-hidden p-2 md:p-4 ${layout === 'desktop' || layout === 'tablet' ? 'grid grid-cols-2 gap-2 md:gap-4' : 'space-y-2 md:space-y-4 flex flex-col'}`}>
        {items.map(item => (
          <div key={item.id} className="flex gap-2 md:gap-4 bg-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 h-fit">
            <div className="w-12 h-12 md:w-20 md:h-20 bg-orange-50 rounded-lg md:rounded-xl flex items-center justify-center text-2xl md:text-4xl shrink-0">
              {item.emoji}
            </div>
            <div className="flex flex-col justify-between flex-1 py-0.5 md:py-1">
              <div>
                <h4 className="font-bold text-slate-800 text-xs md:text-sm leading-tight mb-0.5 md:mb-1">{item.title}</h4>
                <p className="text-[9px] md:text-xs text-gray-500 line-clamp-2 leading-tight md:leading-relaxed">{item.desc}</p>
              </div>
              <div className="flex justify-between items-center mt-1 md:mt-2">
                <span className="font-bold text-orange-600 text-xs md:text-sm">{item.price}</span>
                <button className="bg-orange-50 text-orange-600 px-2 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold">
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function HeroMockup() {
  return (
    <div className="relative w-full max-w-5xl h-[300px] sm:h-[400px] md:h-[550px] mx-auto flex justify-center items-end pb-0 md:pb-10">
      
      {/* Center Background Glow */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[60%] h-[60%] rounded-full bg-orange-300/30 blur-[80px] pointer-events-none mix-blend-multiply"></div>

      {/* 1. Tablet Mockup (Left, Tilted) */}
      <div className="absolute left-[-5%] sm:left-[5%] md:left-[10%] lg:left-[8%] bottom-6 md:bottom-20 -rotate-12 z-10 scale-[0.6] sm:scale-75 md:scale-90 transform-origin-bottom hover:rotate-0 hover:z-40 transition-all duration-500 hover:scale-100 group">
        <div className="relative mx-auto w-[420px] h-[300px] md:w-[460px] md:h-[340px] bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-2 md:p-3 shadow-2xl border-4 border-slate-800 group-hover:shadow-orange-500/20">
          <div className="absolute left-0 inset-y-0 w-6 flex flex-col justify-center items-center z-20">
            <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
          </div>
          <div className="w-full h-full bg-white rounded-[1rem] md:rounded-[1.25rem] overflow-hidden relative">
            <DummyMenu layout="tablet" />
          </div>
        </div>
      </div>

      {/* 2. Laptop Mockup (Center, Straight, Behind) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-12 md:bottom-28 z-0 scale-[0.7] sm:scale-90 md:scale-100 hover:z-40 transition-all duration-500 hover:-translate-y-4 group">
        <div className="relative mx-auto flex flex-col items-center">
          <div className="w-[460px] sm:w-[500px] md:w-[600px] h-[280px] sm:h-[300px] md:h-[380px] bg-slate-900 rounded-t-[1rem] md:rounded-t-[1.5rem] p-2 md:p-3 shadow-2xl border-4 border-slate-800 border-b-0 group-hover:shadow-orange-500/20">
            <div className="absolute top-1.5 inset-x-0 flex justify-center z-20">
              <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
            </div>
            <div className="w-full h-full bg-white rounded-t-sm overflow-hidden relative mt-0.5 md:mt-1">
              <DummyMenu layout="desktop" />
            </div>
          </div>
          <div className="w-[520px] sm:w-[560px] md:w-[680px] h-3 md:h-4 bg-slate-300 rounded-b-lg md:rounded-b-2xl shadow-xl border-t border-slate-400 flex justify-center relative">
            <div className="w-24 md:w-32 h-1 md:h-1.5 bg-slate-400 rounded-b-md"></div>
          </div>
        </div>
      </div>

      {/* 3. Phone Mockup (Right, Tilted, Front) */}
      <div className="absolute right-[-10%] sm:right-[5%] md:right-[15%] lg:right-[12%] bottom-0 md:bottom-8 rotate-12 z-30 scale-[0.65] sm:scale-80 md:scale-100 transform-origin-bottom hover:rotate-0 hover:scale-110 hover:z-50 transition-all duration-500 group">
        <div className="relative mx-auto w-[240px] md:w-[280px] h-[500px] md:h-[580px] bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-2 md:p-3 shadow-2xl border-4 border-slate-800 group-hover:shadow-orange-500/30">
          <div className="absolute top-0 inset-x-0 h-5 md:h-6 flex justify-center z-20">
            <div className="w-20 md:w-24 h-4 md:h-5 bg-slate-900 rounded-b-2xl"></div>
          </div>
          <div className="w-full h-full bg-white rounded-[2rem] md:rounded-[2.25rem] overflow-hidden relative">
            <DummyMenu layout="mobile" />
          </div>
          
          {/* Floating QR Code Badge attached to phone */}
          <div className="absolute -bottom-4 -left-6 md:-left-12 bg-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-2 md:gap-4 transform -rotate-12 z-40">
            <div className="p-1.5 md:p-2 bg-gray-50 rounded-lg md:rounded-xl border border-dashed border-gray-300">
              <QrCode className="w-8 h-8 md:w-10 md:h-10 text-slate-800" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-[10px] md:text-sm">Table 04</p>
              <p className="text-[8px] md:text-xs text-green-500 font-bold flex items-center gap-1">
                <CheckCircle2 size={10} strokeWidth={3} /> Scanned
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
