"use client";

import { Bell, Check, Loader2 } from 'lucide-react';

export default function WaiterNotificationWidget({ waiterRequests = [], resolvingIds = {}, onCompleteRequest }) {
  if (!waiterRequests || waiterRequests.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500 text-white rounded-xl">
            <Bell size={20} className="animate-bounce" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 dark:text-amber-200 text-base">
              Call Waiter Alerts ({waiterRequests.length})
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Customers requesting assistance at their tables.
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto pr-2">
        {waiterRequests.map(req => (
          <div key={req.id} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-base block">
                  {req.table_number ? `Table ${req.table_number}` : 'Unknown Table'}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-md uppercase tracking-wider">
                  {req.request_type || 'waiter'}
                </span>
                {req.note && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-1">
                    "{req.note}"
                  </p>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {req.created_at ? new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
            <button
              disabled={resolvingIds[req.id]}
              onClick={() => onCompleteRequest(req.id)}
              className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-white py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {resolvingIds[req.id] ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Mark Complete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
