"use client";

import { CheckCircle2 } from 'lucide-react';
import FadeIn from './FadeIn';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/plans`)
      .then(res => res.json())
      .then(data => {
        setPlans(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch plans', err);
        setLoading(false);
      });
  }, []);

  return (
    <section id="pricing" className="py-24 px-6 lg:px-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-gray-900">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Choose the perfect plan for your restaurant's needs. All plans include a 14-day free trial.</p>
          </div>
        </FadeIn>

        {loading ? (
          <div className="flex justify-center items-center h-48">
             <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10 items-start max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const isPopular = plan.slug === 'pro' || plan.slug === 'standard';
              const features = Array.isArray(plan.features) 
                ? plan.features 
                : (typeof plan.features === 'string' ? JSON.parse(plan.features) : []);
              
              return (
                <FadeIn key={plan.id} delay={index * 0.1}>
                  <div className={`relative bg-white rounded-[2rem] p-8 md:p-10 flex flex-col h-full z-10 ${isPopular ? 'shadow-2xl shadow-orange-500/10 border-0' : 'shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300'}`}>
                    
                    {isPopular && (
                      <>
                        {/* Rainbow Animated Border using pseudo element and framer motion */}
                        <div className="absolute inset-[-4px] rounded-[2.25rem] bg-[linear-gradient(90deg,#ff8a00,#e52e71,#ff8a00)] bg-[length:200%_100%] animate-[rainbow_3s_linear_infinite] z-[-1]"></div>
                        
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                          Most Popular
                        </div>
                      </>
                    )}

                    <div className="mb-6">
                      <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">{plan.name}</h3>
                      <p className="text-slate-500 text-sm mb-6">Perfect for scaling your business.</p>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">Rs. {plan.price}</span>
                        <span className="text-slate-500 pb-1 font-medium">/ {plan.duration_months === 1 ? 'mo' : plan.duration_months + ' mos'}</span>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="text-orange-500 shrink-0 mt-0.5" size={20} />
                          <span className="text-slate-600 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href={`/register?plan_id=${plan.id}`} className={`block text-center w-full font-bold px-6 py-4 rounded-xl transition-all duration-300 ${isPopular ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-1' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                      Buy Now
                    </Link>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
