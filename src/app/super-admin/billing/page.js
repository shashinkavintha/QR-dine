"use client";

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Download, ArrowUpRight, X } from 'lucide-react';
import { fetchWithSuperAdminAuth as fetchWithAuth } from '@/utils/api';

export default function BillingPage() {
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const [txRes, plansRes] = await Promise.all([
        fetchWithAuth('/api/super-admin/transactions'),
        fetchWithAuth('/api/super-admin/plans')
      ]);
      const txData = await txRes.json();
      const plansData = await plansRes.json();
      setTransactions(Array.isArray(txData) ? txData : []);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSubmitting(true);
    try {
      await fetchWithAuth(`/api/super-admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        body: JSON.stringify({ price: newPrice })
      });
      setEditingPlan(null);
      setNewPrice('');
      fetchBillingData();
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-medium text-slate-500">Loading billing data...</div>;
  }

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Billing & Subscriptions</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">Manage payment history and package pricing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payment History */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Recent Transactions</h3>
            <button className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors hover:bg-orange-100">
              <Download size={14} /> Export
            </button>
          </div>
          
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'Succeeded' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{tx.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500 font-medium">{tx.transaction_id} • {tx.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800">Rs. {parseFloat(tx.amount).toFixed(2)}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-wide ${tx.status === 'Succeeded' ? 'text-green-600' : 'text-rose-600'}`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center text-sm text-slate-500 py-4">No recent transactions.</div>
            )}
          </div>
        </div>

        {/* Package Pricing Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-6">Package Pricing</h3>
          
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{plan.name} Plan</div>
                  <div className="text-xs text-slate-500 font-medium">Monthly Subscription</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-bold text-slate-800">Rs. {parseFloat(plan.price).toFixed(2)}</div>
                  <button 
                    onClick={() => { setEditingPlan(plan); setNewPrice(plan.price); }}
                    className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Plan Price Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Update {editingPlan.name} Plan</h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdatePlan} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Monthly Price (Rs.)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500" 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
