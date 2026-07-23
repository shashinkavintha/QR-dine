"use client";

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { QrCode, Smartphone, LineChart, Languages, BellRing, Star, Sparkles, RefreshCw } from 'lucide-react';

export default function ProductShowcase() {
  const containerRef = useRef(null);

  const features = [
    {
      icon: <QrCode size={24} className="text-orange-500" />,
      title: "Dynamic QR Codes",
      description: "Print once, update anytime. Changes to your menu reflect instantly without ever re-printing a single QR code."
    },
    {
      icon: <Smartphone size={24} className="text-blue-500" />,
      title: "Beautiful Mobile Menus",
      description: "Deliver a stunning, app-like dining experience directly in your guests' mobile browsers."
    },
    {
      icon: <Languages size={24} className="text-green-500" />,
      title: "Multi-language Support",
      description: "Automatically translate your menu into multiple languages to cater to tourists and diverse customers."
    },
    {
      icon: <BellRing size={24} className="text-red-500" />,
      title: "Waiter Calling System",
      description: "Allow guests to instantly notify staff for service, bill, or assistance directly from their table."
    },
    {
      icon: <Star size={24} className="text-yellow-500" />,
      title: "Customer Reviews",
      description: "Collect real-time feedback and ratings from customers before they leave the restaurant."
    },
    {
      icon: <Sparkles size={24} className="text-purple-500" />,
      title: "Smart Upselling",
      description: "Increase order value by suggesting complementary add-ons and pairings to your guests."
    },
    {
      icon: <LineChart size={24} className="text-emerald-500" />,
      title: "Real-time Analytics",
      description: "Track revenue, scan rates, and popular items live. Make data-driven decisions."
    },
    {
      icon: <RefreshCw size={24} className="text-indigo-500" />,
      title: "Real-time Sync",
      description: "All waiter calls, reviews, and menu updates sync instantly across your merchant dashboard."
    }
  ];

  return (
    <section id="features" ref={containerRef} className="py-24 overflow-hidden bg-white relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center mb-20 relative z-10">
        <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 text-slate-900 tracking-tight">
          Everything you need to manage menus
        </h2>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
          Say goodbye to messy PDFs and outdated printouts. Take full control of your digital dining experience with our powerful features.
        </p>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-start group">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
