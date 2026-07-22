"use client";

import { QrCode, UtensilsCrossed, TrendingUp, Users, BarChart3, Loader2, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import Link from 'next/link';

export default function TenantOverviewPage() {
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch settings for restaurant name
        const resSettings = await fetchWithAuth('/api/tenant/settings');
        const dataSettings = await resSettings.json();
        setRestaurantName(dataSettings.settings?.restaurant_name || dataSettings.restaurant_name || '');

        const resAnalytics = await fetchWithAuth('/api/tenant/analytics/dashboard?date_filter=today');
        const dataAnalytics = await resAnalytics.json();
        if (resAnalytics.ok) {
          setAnalytics(dataAnalytics);
        } else {
          setAnalytics({ error: true, message: dataAnalytics.error });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 animate-pulse">
          <div className="w-1/3">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-pulse h-[160px]">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 mb-4"></div>
              <div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 min-h-[300px] flex flex-col items-center justify-center animate-pulse">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
          <div className="h-12 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.error || !analytics.kpis) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Welcome Back, {restaurantName}! 👋</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Here is what's happening with your digital menu today.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <BarChart3 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Overview Restricted</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            You do not have the required permissions to view the restaurant's overview and analytics.
          </p>
        </div>
      </div>
    );
  }

  const topItem = analytics.top_items && analytics.top_items.length > 0 ? analytics.top_items[0] : null;

  const stats = [
    { title: "Total Orders (Today)", value: analytics.kpis.total_orders, change: "Orders today", icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-100" },
    { title: "Total Revenue (Today)", value: `Rs. ${Number(analytics.kpis.total_revenue).toFixed(2)}`, change: "Revenue today", icon: TrendingUp, color: "text-green-500", bg: "bg-green-100" },
    { title: "Most Popular Item", value: topItem ? topItem.name : "N/A", change: topItem ? `${topItem.value} sold` : "No sales yet", icon: UtensilsCrossed, color: "text-orange-500", bg: "bg-orange-100" },
    { title: "Active Tables", value: analytics.kpis.active_tables, change: "Tables with orders", icon: Users, color: "text-purple-500", bg: "bg-purple-100" },
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Welcome Back, {restaurantName}! 👋</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Here is what's happening with your digital menu today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} dark:bg-opacity-20`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">{stat.title}</h3>
              <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 truncate">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">{stat.change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Banner */}
      <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 min-h-[300px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mb-4">
          <BarChart3 size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Detailed Analytics Available</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          Dive deeper into your restaurant's performance, track peak ordering hours, and view historical data on the Analytics dashboard.
        </p>
        <Link 
          href="/dashboard/analytics"
          className="bg-black dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors"
        >
          View Full Analytics
        </Link>
      </div>

    </div>
  );
}
