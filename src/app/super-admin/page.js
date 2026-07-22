"use client";

import { Users, CreditCard, Building2, TrendingUp, Activity, ArrowUpRight } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState({
    total_active_hotels: 0,
    mrr: 0,
    hotels_on_trial: 0,
    total_users: 0,
    recent_signups: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem('tenant_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/super-admin/overview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else if (res.status === 401 || res.status === 403) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch overview data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [router]);

  const stats = [
    { title: "Total Active Hotels", value: data.total_active_hotels.toLocaleString(), change: "+12%", icon: Building2, color: "text-blue-500", bg: "bg-blue-100" },
    { title: "Monthly Recurring Revenue", value: `Rs. ${data.mrr.toLocaleString()}`, change: "+8.4%", icon: CreditCard, color: "text-green-500", bg: "bg-green-100" },
    { title: "Hotels on Trial", value: data.hotels_on_trial.toLocaleString(), change: "+24%", icon: Activity, color: "text-orange-500", bg: "bg-orange-100" },
    { title: "Total Users", value: data.total_users.toLocaleString(), change: "+18%", icon: Users, color: "text-purple-500", bg: "bg-purple-100" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-8">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="flex items-center text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                <ArrowUpRight size={16} className="mr-1" />
                {stat.change}
              </span>
            </div>
            <h3 className="text-slate-500 font-medium text-sm mb-1">{stat.title}</h3>
            <div className="text-3xl font-extrabold text-slate-800">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart (Dummy Box for now) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg text-slate-800">Revenue Overview</h2>
            <select className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 font-medium outline-none text-slate-600">
              <option>Last 30 Days</option>
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center text-slate-400 gap-2">
              <TrendingUp size={48} className="opacity-20" />
              <p className="font-medium text-sm">Chart component will render here</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-bold text-lg text-slate-800 mb-6">Recent Signups</h2>
          <div className="space-y-5">
            {data.recent_signups.map((hotel, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                  {hotel.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-800 truncate">{hotel.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-slate-500">{hotel.created_at}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-xs font-bold text-slate-600">{hotel.plan}</span>
                  </div>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
                    ${hotel.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                      hotel.status === 'TRIALING' ? 'bg-orange-100 text-orange-700' : 
                      'bg-rose-100 text-rose-700'}`}>
                    {hotel.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2.5 text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors rounded-xl">
            View All Tenants
          </button>
        </div>
      </div>

    </div>
  );
}
