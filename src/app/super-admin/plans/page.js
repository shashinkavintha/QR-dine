"use client";

import { useState, useEffect } from 'react';
import { Package, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchWithSuperAdminAuth as fetchWithAuth } from '@/utils/api';

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const loadPlans = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/plans`)
      .then(res => res.json())
      .then(data => {
        setPlans(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleUpdatePlan = async (id, updatedData) => {
    setSaving(true);
    setSuccess('');
    try {
      const res = await fetchWithAuth(`/api/super-admin/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        setSuccess('Plan updated successfully!');
        loadPlans();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        alert('Failed to update plan');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating plan');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-orange-500" />
            Manage Plans & Pricing
          </h2>
          <p className="text-slate-500 text-sm mt-1">Configure subscription plans, pricing, and features.</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} />
          <span className="font-bold">{success}</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <PlanEditor 
            key={plan.id} 
            plan={plan} 
            onSave={(data) => handleUpdatePlan(plan.id, data)}
            disabled={saving}
          />
        ))}
      </div>
    </div>
  );
}

function PlanEditor({ plan, onSave, disabled }) {
  const [price, setPrice] = useState(plan.price);
  const [duration, setDuration] = useState(plan.duration_months);
  const [maxMenuItems, setMaxMenuItems] = useState(plan.max_menu_items === null ? '' : plan.max_menu_items);
  const [maxTables, setMaxTables] = useState(plan.max_tables === null ? '' : plan.max_tables);
  
  const getInitialFeatures = () => {
    if (!plan.features) return '';
    if (Array.isArray(plan.features)) return plan.features.join('\n');
    try {
      return JSON.parse(plan.features).join('\n');
    } catch (e) {
      return plan.features;
    }
  };

  const [features, setFeatures] = useState(getInitialFeatures());

  useEffect(() => {
    setPrice(plan.price);
    setDuration(plan.duration_months);
    setMaxMenuItems(plan.max_menu_items === null ? '' : plan.max_menu_items);
    setMaxTables(plan.max_tables === null ? '' : plan.max_tables);
    setFeatures(getInitialFeatures());
  }, [plan]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="mb-4">
        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          {plan.slug}
        </span>
        <h3 className="text-2xl font-extrabold text-slate-800 mt-2">{plan.name} Plan</h3>
      </div>
      
      <div className="space-y-4 flex-grow">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Price (LKR)</label>
          <input 
            type="number" 
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-2 text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Duration (Months)</label>
          <input 
            type="number" 
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-2 text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Max Menu Items (Leave empty for Unlimited)</label>
          <input 
            type="number" 
            value={maxMenuItems}
            onChange={(e) => setMaxMenuItems(e.target.value)}
            placeholder="Unlimited"
            className="w-full border border-slate-300 rounded-xl px-4 py-2 text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Max Tables (Leave empty for Unlimited)</label>
          <input 
            type="number" 
            value={maxTables}
            onChange={(e) => setMaxTables(e.target.value)}
            placeholder="Unlimited"
            className="w-full border border-slate-300 rounded-xl px-4 py-2 text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Features (One per line)</label>
          <textarea 
            rows={4}
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-2 text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
          />
        </div>
      </div>

      <button
        onClick={() => onSave({
          price: parseFloat(price),
          duration_months: parseInt(duration),
          max_menu_items: maxMenuItems === '' ? null : parseInt(maxMenuItems),
          max_tables: maxTables === '' ? null : parseInt(maxTables),
          features: features.split('\n').filter(f => f.trim() !== '')
        })}
        disabled={disabled}
        className="mt-6 w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save size={18} />
        Save Changes
      </button>
    </div>
  );
}
