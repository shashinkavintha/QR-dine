"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2, CheckCircle2, ExternalLink, Heart, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ReviewModal({ isOpen, onClose, tenantId, branding }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setCustomerName('');
    setSubmitted(false);
    setRedirectUrl(null);
    setResponseMessage('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    if (!tenantId) {
      toast.error('Restaurant ID missing');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tenant_id: tenantId,
        rating: rating,
        comment: comment || null,
        customer_name: customerName.trim() || null,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/public/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmitted(true);
        setResponseMessage(data.message || 'Thank you for your feedback!');
        if (data.redirect_url) {
          setRedirectUrl(data.redirect_url);
        } else if (rating >= 4 && branding?.google_review_url) {
          setRedirectUrl(branding.google_review_url);
        }
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while submitting your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentActiveRating = hoverRating || rating;

  return (
    <AnimatePresence>
      <motion.div
        key="review-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleResetAndClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          key="review-modal-content"
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
                <Star size={22} className="fill-amber-400 text-amber-400" />
                Customer Review
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Share your dining experience with us
              </p>
            </div>
            <button
              onClick={handleResetAndClose}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-700 transition shadow-sm"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating Input */}
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                    How would you rate your experience?
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          size={36}
                          className={`transition-colors ${
                            star <= currentActiveRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">
                      {rating >= 4 ? 'Great experience! 🌟' : 'Thanks for letting us know.'}
                    </p>
                  )}
                </div>

                {/* Conditional View */}
                {rating >= 1 && rating <= 3 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Your Name (optional)
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Please tell us what went wrong
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Your feedback helps us improve..."
                        rows={3}
                        className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </motion.div>
                )}

                {rating >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-center"
                  >
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      We appreciate your support! Click below to submit your rating.
                    </p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-[0.98] disabled:opacity-50 shadow-lg"
                  style={{ backgroundColor: branding?.primary_color || '#f97316' }}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : rating >= 4 ? (
                    'Submit Review'
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </form>
            ) : (
              /* Success View */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-5"
              >
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
                    Thank You!
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {responseMessage}
                  </p>
                </div>

                {rating >= 4 && redirectUrl && (
                  <div className="pt-2">
                    <a
                      href={redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition"
                    >
                      <ExternalLink size={18} />
                      Leave Review on Google / TripAdvisor
                    </a>
                  </div>
                )}

                <button
                  onClick={handleResetAndClose}
                  className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:bg-slate-700 transition"
                >
                  Close
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
