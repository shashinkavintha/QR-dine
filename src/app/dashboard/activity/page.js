"use client";

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import toast from 'react-hot-toast';
import { Loader2, History, ArrowRight } from 'lucide-react';

export default function ActivityLogPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/tenant/audit-logs?page=${pageNum}`).catch(() => ({ ok: false }));
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setLogs(data.data || []);
        } else {
          setLogs(prev => [...prev, ...(data.data || [])]);
        }
        setHasMore(data.current_page < data.last_page);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const formatKey = (key) => {
    const map = {
      is_available: 'Availability',
      price: 'Price',
      name: 'Name',
      description: 'Description',
      category_id: 'Category',
      image_path: 'Image',
      brand_color: 'Brand Color',
      currency: 'Currency'
    };
    if (map[key]) return map[key];
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (key, val) => {
    if (key === 'is_available') {
      return val == 1 || val === true || val === 'true' || val === '1' ? 'Available' : 'Unavailable';
    }
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    if (val === null || val === '') return 'Empty';
    return String(val);
  };

  const formatModel = (type) => {
    const model = type.split('\\').pop();
    const map = {
      MenuItem: 'Menu Item',
      MenuCategory: 'Menu Category',
      TenantSetting: 'Restaurant Setting'
    };
    return map[model] || model;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Log</h1>
        <p className="text-slate-500 text-sm mt-1">Track all modifications made to your menus, items, and settings.</p>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {logs.length === 0 && !loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <History size={48} className="mb-4 text-slate-300 dark:text-slate-700" />
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => (
              <div key={log.id} className="p-4 md:p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                      {log.event === 'created' ? 'NEW' : log.event === 'updated' ? 'UPD' : 'DEL'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {log.user?.name || log.user?.email || 'User'} {log.event} a {formatModel(log.auditable_type)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Show changes */}
                {log.event === 'updated' && log.old_values && log.new_values && (
                  <div className="mt-4 pl-12">
                    <div className="text-xs font-semibold text-slate-500 mb-2">Changes:</div>
                    <div className="space-y-2">
                      {Object.keys(log.new_values).map(key => (
                        <div key={key} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-xs text-slate-600 dark:text-slate-400 min-w-[80px]">{formatKey(key)}:</span>
                          <span className="text-red-500 line-through">{formatValue(key, log.old_values[key])}</span>
                          <ArrowRight size={14} className="text-slate-400 mx-1" />
                          <span className="text-green-600 font-medium">{formatValue(key, log.new_values[key])}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button 
              onClick={() => {
                setPage(p => p + 1);
                fetchLogs(page + 1);
              }}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
        
        {loading && logs.length === 0 && (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}
