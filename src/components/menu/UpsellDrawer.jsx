"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function UpsellDrawer({ isOpen, onClose, sourceItemName, suggestedItem, onAddToCart, branding }) {
  if (!isOpen || !suggestedItem) return null;

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${url}`;
  };

  const handleAdd = () => {
    onAddToCart(suggestedItem);
    onClose();
  };

  const currencySymbol = branding?.currency?.trim() || 'Rs.';
  const formattedPrice = `${currencySymbol} ${parseFloat(suggestedItem.price || 0).toFixed(2)}`;

  return (
    <AnimatePresence>
      <motion.div
        key="upsell-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          key="upsell-container"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span>Recommended with {sourceItemName}</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Item Content */}
          <div className="p-5 flex gap-4 items-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0 overflow-hidden relative border border-slate-100 dark:border-slate-800/50">
              {suggestedItem.image_url ? (
                <img
                  src={getImageUrl(suggestedItem.image_url)}
                  alt={suggestedItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                  <ImageIcon size={24} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-snug truncate">
                {suggestedItem.name}
              </h4>
              {suggestedItem.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  {suggestedItem.description}
                </p>
              )}
              <div className="font-extrabold text-sm mt-1.5" style={{ color: branding?.primary_color || '#f97316' }}>
                Recommended with {sourceItemName}: {suggestedItem.name} - {formattedPrice}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              No thanks
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
              style={{ backgroundColor: branding?.primary_color || '#f97316' }}
            >
              <Plus size={16} />
              Add to Cart
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
