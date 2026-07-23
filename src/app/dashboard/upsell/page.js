"use client";

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Loader2, 
  ArrowRight, 
  UtensilsCrossed, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UpsellRulesPage() {
  const [rules, setRules] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedSuggestedItemId, setSelectedSuggestedItemId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingIds, setDeletingIds] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, menuRes] = await Promise.all([
        fetchWithAuth('/api/tenant/upsell-rules'),
        fetchWithAuth('/api/tenant/menu')
      ]);

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(Array.isArray(rulesData) ? rulesData : []);
      }

      if (menuRes.ok) {
        const categories = await menuRes.json();
        const items = [];
        if (Array.isArray(categories)) {
          categories.forEach(cat => {
            if (Array.isArray(cat.items)) {
              cat.items.forEach(item => {
                items.push({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  categoryName: cat.name
                });
              });
            }
          });
        }
        setMenuItems(items);
      }
    } catch (e) {
      console.error('Error fetching upsell data:', e);
      toast.error('Failed to load upsell rules or menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!selectedItemId || !selectedSuggestedItemId) {
      toast.error('Please select both a trigger item and a suggested item.');
      return;
    }
    if (selectedItemId === selectedSuggestedItemId) {
      toast.error('Trigger item and suggested item must be different.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetchWithAuth('/api/tenant/upsell-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: selectedItemId,
          suggested_item_id: selectedSuggestedItemId
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Upsell rule created successfully!');
        setSelectedItemId('');
        setSelectedSuggestedItemId('');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to create upsell rule');
      }
    } catch (e) {
      console.error('Error adding rule:', e);
      toast.error('Failed to create upsell rule');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRule = async (id) => {
    setDeletingIds(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetchWithAuth(`/api/tenant/upsell-rules/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Upsell rule deleted');
        setRules(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error('Failed to delete upsell rule');
      }
    } catch (e) {
      console.error('Error deleting rule:', e);
      toast.error('Failed to delete upsell rule');
    } finally {
      setDeletingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl w-full pb-24 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <Sparkles className="text-orange-500" size={28} />
          Rule-Based Upselling Management
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Suggest complementary dishes or beverages automatically when a customer adds specific items to their cart.
        </p>
      </div>

      {/* Add New Rule Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Plus size={20} className="text-orange-500" />
            Create Upsell Rule
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose a trigger item and the item you want to recommend to customers.
          </p>
        </div>

        <form onSubmit={handleAddRule} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Dropdown 1: Trigger Item A */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Item A: Trigger Item
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-slate-100 shadow-sm"
              >
                <option value="">-- Select Trigger Item --</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.categoryName})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                When customer adds this item to cart...
              </p>
            </div>

            {/* Dropdown 2: Suggested Item B */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Item B: Suggested Upsell Item
              </label>
              <select
                value={selectedSuggestedItemId}
                onChange={(e) => setSelectedSuggestedItemId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-slate-100 shadow-sm"
              >
                <option value="">-- Select Suggested Item --</option>
                {menuItems
                  .filter((item) => item.id !== selectedItemId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.categoryName})
                    </option>
                  ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ...suggest this dish, drink, or side item.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creating || !selectedItemId || !selectedSuggestedItemId}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
            >
              {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Add Upsell Rule
            </button>
          </div>
        </form>
      </div>

      {/* Rules Table / List Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Active Upsell Rules ({rules.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rules configured for automatic smart recommendations on digital menus.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <Sparkles size={36} className="mx-auto mb-3 opacity-60" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No upsell rules created yet</p>
            <p className="text-xs mt-1">Select items above to configure your first smart recommendation rule.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Trigger Item (Item A)</th>
                  <th className="py-4 px-6 text-center">Relation</th>
                  <th className="py-4 px-6">Suggested Item (Item B)</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {rules.map((rule) => {
                  const itemAName = rule.item?.name || 'Unknown Item';
                  const itemBName = (rule.suggested_item || rule.suggestedItem)?.name || 'Unknown Item';

                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          {itemAName}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-400">
                        <div className="inline-flex items-center justify-center p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <ArrowRight size={16} className="text-orange-500" />
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-emerald-600 dark:text-emerald-400">
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-emerald-500" />
                          {itemBName}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          disabled={deletingIds[rule.id]}
                          onClick={() => handleDeleteRule(rule.id)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {deletingIds[rule.id] ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
