"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Droplet, Receipt, X, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CallWaiterModal({ isOpen, onClose, tenantId, tableId, branding }) {
  const [selectedType, setSelectedType] = useState('waiter');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId) {
      toast.error('Restaurant ID missing');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tenant_id: tenantId,
        table_id: tableId || null,
        request_type: selectedType,
        note: note.trim() || null,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/public/waiter-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Staff notified!', {
          style: {
            borderRadius: '100px',
            background: '#333',
            color: '#fff',
            fontWeight: 'bold',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#333',
          },
        });
        setNote('');
        onClose();
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to notify staff. Please try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while sending your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const options = [
    {
      id: 'waiter',
      label: 'Call Waiter',
      description: 'Request staff assistance at your table',
      icon: Bell,
    },
    {
      id: 'water',
      label: 'Water',
      description: 'Request complementary table water',
      icon: Droplet,
    },
    {
      id: 'bill',
      label: 'Bill',
      description: 'Request your final bill or payment option',
      icon: Receipt,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        key="waiter-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          key="waiter-modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Bell size={22} style={{ color: branding?.primary_color || '#f97316' }} />
                Service Request
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Select options to notify staff
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-700 transition shadow-sm"
            >
              <X size={18} />
            </button>
          </div>

          {/* Options */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-3">
              {options.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = selectedType === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setSelectedType(opt.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 shadow-sm'
                        : 'border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 hover:border-slate-200 dark:border-slate-700'
                    }`}
                    style={isSelected ? { borderColor: branding?.primary_color || '#f97316' } : {}}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                      style={isSelected ? { backgroundColor: branding?.primary_color || '#f97316' } : {}}
                    >
                      <IconComponent size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                        {opt.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {opt.description}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      style={isSelected ? { backgroundColor: branding?.primary_color || '#f97316', borderColor: branding?.primary_color || '#f97316' } : {}}
                    >
                      {isSelected && <CheckCircle2 size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Note to staff (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="E.g. Extra napkins, ice, or specific request..."
                rows={2}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-[0.98] disabled:opacity-70 shadow-lg"
                style={{ backgroundColor: branding?.primary_color || '#f97316' }}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Bell size={20} />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
