"use client";

import { motion } from 'framer-motion';
import { ShieldCheck, Lock, QrCode } from 'lucide-react';

export default function TrustSignals() {
  const signals = [
    {
      icon: <ShieldCheck size={28} className="text-orange-500" />,
      title: "100% Secure Payments with PayHere",
    },
    {
      icon: <Lock size={28} className="text-orange-500" />,
      title: "Enterprise-Grade Data Security",
    },
    {
      icon: <QrCode size={28} className="text-orange-500" />,
      title: "Level-H QR Technology",
    }
  ];

  return (
    <section className="py-16 bg-white overflow-hidden border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-10">
          Built for reliability and scale
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-center">
          {signals.map((signal, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                {signal.icon}
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{signal.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
