'use client';
import { useState, useEffect } from 'react';
import { fetchWithSuperAdminAuth } from '@/utils/api';
import { Check, X, Eye, FileText, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function BankTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetchWithSuperAdminAuth('/api/super-admin/bank-transfers/pending');
      const data = await res.json();
      setTransfers(data.transactions || []);
    } catch (err) {
      toast.error('Failed to load bank transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      setActionLoading(true);
      const res = await fetchWithSuperAdminAuth(`/api/super-admin/bank-transfers/${id}/${action}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Action failed');
      
      toast.success(`Transfer ${action}d successfully`);
      setSelectedTransfer(null);
      fetchTransfers();
    } catch (err) {
      toast.error(err.message || `Failed to ${action} transfer`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Bank Transfers</h1>
        <p className="text-slate-600">Review and approve manual payments uploaded by users.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : transfers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-slate-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">All Caught Up!</h3>
          <p className="text-slate-500 mt-2">There are no pending bank transfers to review.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-600">
                <th className="py-4 px-6">Transaction ID</th>
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-4 px-6 text-sm font-medium text-slate-700">{t.transaction_id}</td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-bold text-slate-800">{t.user?.name || (t.user?.first_name + ' ' + t.user?.last_name)}</div>
                    <div className="text-xs text-slate-500">{t.user?.email}</div>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-800">LKR {Number(t.amount).toLocaleString()}</td>
                  <td className="py-4 px-6 text-sm text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      t.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                      t.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedTransfer(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye size={16} />
                      {t.status === 'pending' ? 'Review Slip' : 'View Slip'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedTransfer.status === 'pending' ? 'Review Payment Slip' : 'Payment Slip Details'}
              </h2>
              <button 
                onClick={() => setSelectedTransfer(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1">User Details</p>
                  <p className="font-bold text-slate-800">{selectedTransfer.user?.name || (selectedTransfer.user?.first_name + ' ' + selectedTransfer.user?.last_name)}</p>
                  <p className="text-sm text-slate-600">{selectedTransfer.user?.email}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1">Payment Info</p>
                  <p className="font-bold text-slate-800">LKR {Number(selectedTransfer.amount).toLocaleString()}</p>
                  <p className="text-sm text-slate-600">{selectedTransfer.transaction_id}</p>
                </div>
              </div>

              <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center ${selectedTransfer.payment_slip_path?.toLowerCase().endsWith('.pdf') ? 'p-0' : 'p-4'}`}>
                {selectedTransfer.payment_slip_path ? (
                  selectedTransfer.payment_slip_path.toLowerCase().endsWith('.pdf') ? (
                    <div className="py-12 flex flex-col items-center justify-center bg-slate-50 w-full rounded-xl">
                      <FileText size={48} className="text-orange-500 mb-4" />
                      <p className="text-slate-700 font-medium mb-4">PDF Payment Slip</p>
                      <button 
                        onClick={() => setIsFullscreen(true)}
                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-2"
                      >
                        <Search size={18} /> View Full Screen
                      </button>
                    </div>
                  ) : (
                    <div className="relative group cursor-pointer" onClick={() => setIsFullscreen(true)}>
                      <img 
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/storage/${selectedTransfer.payment_slip_path}`} 
                        alt="Payment Slip" 
                        className="max-w-full max-h-[500px] object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-full flex items-center gap-2">
                          <Search size={18} /> View Full Screen
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="py-20 text-center text-slate-400">
                    <FileText size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No slip uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {selectedTransfer.status === 'pending' && (
              <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                <button
                  onClick={() => handleAction(selectedTransfer.id, 'reject')}
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Reject Payment
                </button>
                <button
                  onClick={() => handleAction(selectedTransfer.id, 'approve')}
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
                >
                  {actionLoading && <Loader2 size={18} className="animate-spin" />}
                  Approve & Activate
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Image Overlay */}
      {isFullscreen && selectedTransfer?.payment_slip_path && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-[70]"
            onClick={() => setIsFullscreen(false)}
          >
            <X size={24} />
          </button>
          {selectedTransfer.payment_slip_path.toLowerCase().endsWith('.pdf') ? (
            <embed 
              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/storage/${selectedTransfer.payment_slip_path}`} 
              type="application/pdf"
              className="w-full max-w-5xl h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img 
              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/storage/${selectedTransfer.payment_slip_path}`} 
              alt="Payment Slip Fullscreen" 
              className="max-w-full max-h-[90vh] object-contain cursor-zoom-out"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
