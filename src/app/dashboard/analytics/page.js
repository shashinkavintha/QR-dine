'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, CreditCard, 
  Loader2, AlertCircle, Calendar, Utensils
} from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

function AnalyticsContent() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');

  const fetchAnalytics = async (filter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/tenant/analytics/dashboard?date_filter=${filter}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(dateFilter);
  }, [dateFilter]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Analytics Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Monitor your restaurant's performance and sales.</p>
        </div>
        
        <div className="relative inline-block w-48">
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-2.5 pl-10 pr-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium"
            disabled={loading}
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="all_time">All Time</option>
          </select>
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-start gap-4">
              <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-3 rounded-lg">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Orders</p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{data.kpis.total_orders}</h4>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-start gap-4">
              <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">Rs. {Number(data.kpis.total_revenue).toFixed(2)}</h4>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-start gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-lg">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Order Value</p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">Rs. {Number(data.kpis.average_order_value).toFixed(2)}</h4>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-start gap-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-3 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Tables</p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{data.kpis.active_tables}</h4>
              </div>
            </div>
            
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Peak Hours Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <TrendingUp className="text-slate-400 dark:text-slate-500" size={20}/>
                Peak Ordering Hours
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.peak_hours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Selling Items */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Utensils className="text-slate-400 dark:text-slate-500" size={20}/>
                Top Selling Items
              </h3>
              
              {data.top_items.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="h-48 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.top_items}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {data.top_items.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="w-full space-y-3">
                    {data.top_items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{item.value} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-sm text-center">
                  <ShoppingBag className="mb-2 text-slate-300" size={32} />
                  No item sales in this period
                </div>
              )}
            </div>
            
          </div>

          {/* Table Performance */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Users className="text-slate-400 dark:text-slate-500" size={20}/>
                  Table Performance
               </h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Most active tables based on order volume and revenue.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4">Table No / Identifier</th>
                    <th className="px-6 py-4 text-center">Total Orders</th>
                    <th className="px-6 py-4 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {data.table_performance.length > 0 ? (
                    data.table_performance.map((table, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                          Table {table.table_number}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2.5 py-0.5 rounded-full font-medium">
                            {table.orders}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">
                          Rs. {Number(table.revenue).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        No table activity found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      ) : null}

    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
