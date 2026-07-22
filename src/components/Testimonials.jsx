"use client";

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import React from 'react';

const reviews = [
  { text: "Switching to this QR menu system saved us thousands in printing costs. Our guests love it.", author: "John D.", role: "Manager" },
  { text: "The setup was unbelievably easy. Had our menu digitized in 30 minutes. Highly recommended!", author: "Sarah M.", role: "Owner" },
  { text: "Sales went up 20% since we added photos to every item. Best investment for our restaurant.", author: "Mike T.", role: "Chef" },
  { text: "Multi-language support is a game changer for our tourist customers. They love it.", author: "Elena R.", role: "Director" },
  { text: "Updating prices instantly during happy hour is so convenient. Five stars!", author: "David K.", role: "Owner" },
];

const ReviewCard = ({ review }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col gap-4 w-full">
    <div className="flex text-amber-400">
      {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
    </div>
    <p className="text-slate-700 font-medium leading-relaxed text-sm">"{review.text}"</p>
    <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
      <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xs">{review.author[0]}</div>
      <div>
        <h4 className="font-bold text-slate-900 text-sm">{review.author}</h4>
        <p className="text-slate-500 text-xs">{review.role}</p>
      </div>
    </div>
  </div>
);

export default function Testimonials() {
  const [reviews, setReviews] = React.useState([]);

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/public/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.landing_page_testimonials) {
          try {
            const parsed = JSON.parse(data.landing_page_testimonials);
            if (Array.isArray(parsed)) {
              // Only set reviews if there are actual entries with text
              const validReviews = parsed.filter(r => r.text && r.author);
              setReviews(validReviews);
            }
          } catch (e) {
            console.error("Error parsing testimonials:", e);
          }
        }
      })
      .catch(err => console.error("Error fetching testimonials:", err));
  }, []);

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-slate-50 overflow-hidden border-t border-slate-200/60 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center mb-16 relative z-10">
        <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 text-slate-900">What Our Partners Say</h2>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Join hundreds of restaurants already transforming their dining experience.</p>
      </div>

      <div className="relative h-[600px] max-w-6xl mx-auto overflow-hidden px-4 md:px-8">
        
        {/* Top/Bottom Fade Masks */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 to-transparent z-10 pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          
          {/* Column 1 - Normal Speed */}
          <div className="relative h-full overflow-hidden hidden md:block">
            <motion.div
              animate={{ y: ["0%", "-50%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="flex flex-col"
            >
              {[...reviews, ...reviews].map((r, i) => <ReviewCard key={i} review={r} />)}
            </motion.div>
          </div>

          {/* Column 2 - Slow Speed */}
          <div className="relative h-full overflow-hidden">
            <motion.div
              animate={{ y: ["-50%", "0%"] }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              className="flex flex-col"
            >
              {[...reviews, ...reviews].reverse().map((r, i) => <ReviewCard key={i} review={r} />)}
            </motion.div>
          </div>

          {/* Column 3 - Fast Speed */}
          <div className="relative h-full overflow-hidden hidden md:block">
            <motion.div
              animate={{ y: ["0%", "-50%"] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="flex flex-col"
            >
              {[...reviews.slice(2), ...reviews.slice(0, 2), ...reviews.slice(2), ...reviews.slice(0, 2)].map((r, i) => <ReviewCard key={i} review={r} />)}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
