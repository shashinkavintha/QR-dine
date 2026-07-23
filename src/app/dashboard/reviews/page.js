"use client";

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  Loader2, 
  Search, 
  Filter,
  AlertTriangle,
  Clock,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ComplaintsReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [markingIds, setMarkingIds] = useState({});
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/tenant/reviews/complaints');
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } else {
        toast.error('Failed to fetch customer complaints');
      }
    } catch (e) {
      console.error('Error fetching complaints:', e);
      toast.error('Failed to fetch customer complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const markAsRead = async (id) => {
    setMarkingIds(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetchWithAuth(`/api/tenant/reviews/complaints/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' })
      });

      if (res.ok) {
        toast.success('Complaint marked as read');
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'read' } : r));
      } else {
        toast.error('Failed to update status');
      }
    } catch (e) {
      console.error('Error marking complaint as read:', e);
      toast.error('Failed to update status');
    } finally {
      setMarkingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = 
      (r.customer_name && r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.comment && r.comment.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalCount = reviews.length;
  const unreadCount = reviews.filter(r => r.status === 'unread').length;
  const readCount = reviews.filter(r => r.status === 'read').length;

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300 dark:text-slate-700'
            }
          />
        ))}
        <span className="ml-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          {rating} / 5
        </span>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl w-full pb-24 space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <Star className="text-amber-500" size={28} />
          Customer Reviews & Feedback
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Review all customer ratings and feedback.
        </p>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Reviews</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</h3>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
            <MessageSquare size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Unread Alerts</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{unreadCount}</h3>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Reviewed / Read</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{readCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Filter Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus('unread')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'unread'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilterStatus('read')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'read'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Read ({readCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Complaints List / Table */}
      {loading ? (
        <div className="p-12 flex justify-center items-center">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No reviews found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or status filter.'
              : 'Great job! No customer reviews have been recorded.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Rating</th>
                  <th className="py-4 px-6">Comment</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredReviews.map((review) => (
                  <tr 
                    key={review.id} 
                    onClick={() => setSelectedReview(review)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                      {review.customer_name || 'Anonymous Customer'}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {renderStars(review.rating)}
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <p className="text-slate-700 dark:text-slate-300 text-xs truncate">
                        {review.comment ? `"${review.comment}"` : <span className="italic text-slate-400">No comment provided</span>}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString()} {new Date(review.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {review.status === 'unread' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          Unread
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          Read
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      {review.status === 'unread' ? (
                        <button
                          disabled={markingIds[review.id]}
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(review.id);
                          }}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ml-auto disabled:opacity-50"
                        >
                          {markingIds[review.id] ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Mark Read
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Details Modal */}
      <AnimatePresence>
        {selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReview(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare size={20} className="text-orange-500" />
                  Review Details
                </h3>
                <button 
                  onClick={() => setSelectedReview(null)}
                  className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedReview.customer_name || 'Anonymous Customer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {new Date(selectedReview.created_at).toLocaleDateString()} at {new Date(selectedReview.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Rating</p>
                  {renderStars(selectedReview.rating)}
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Comment</p>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedReview.comment || <span className="italic text-slate-500">No comment provided.</span>}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
                {selectedReview.status === 'unread' ? (
                  <button
                    onClick={() => {
                      markAsRead(selectedReview.id);
                      setSelectedReview(null);
                    }}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    <Check size={16} />
                    Mark as Read & Close
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-bold transition-all hover:bg-slate-300 dark:hover:bg-slate-700"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
