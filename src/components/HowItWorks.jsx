"use client";

import { motion } from 'framer-motion';
import FadeIn from './FadeIn';

export default function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Sign Up & Add Menu",
      desc: "Create an account and easily add your categories, items, prices, and mouth-watering photos in our intuitive dashboard.",
      icon: "✍️"
    },
    {
      num: "2",
      title: "Generate QR Codes",
      desc: "Download your unique, high-quality QR codes. Print and place them on your tables, counters, or in hotel rooms.",
      icon: "🖨️"
    },
    {
      num: "3",
      title: "Guests Scan & Enjoy",
      desc: "Customers simply scan the code with their phone camera to instantly view your beautiful digital menu. No app required!",
      icon: "📱"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 lg:px-12 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">How it Works</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">Get your digital menu up and running in minutes. It's that simple.</p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-12 lg:gap-8 relative pt-4">
          
          {/* Connecting line (Desktop only) */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 border-t-2 border-dashed border-slate-200 z-0"></div>

          {steps.map((step, index) => (
            <FadeIn key={index} delay={index * 0.2}>
              <div className="relative z-10 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-24 h-24 bg-white rounded-full border-8 border-orange-50 shadow-xl flex items-center justify-center text-4xl mb-6 relative group-hover:border-orange-100 transition-colors duration-300">
                  {step.icon}
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md border-4 border-white">
                    {step.num}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">{step.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                  {step.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
