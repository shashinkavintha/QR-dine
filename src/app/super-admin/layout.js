"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Settings, 
  Users,
  LogOut,
  Bell,
  Package
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SuperAdminLayout({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const token = localStorage.getItem('tenant_token');
        if (!token) {
          window.location.href = '/login';
          return;
        }
        
        const res = await fetch('http://127.0.0.1:8000/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) throw new Error('Not logged in');
        const user = await res.json();
        
        if (user.role !== 'super_admin') {
          window.location.href = '/dashboard';
          return;
        }
        
        setLoading(false);
      } catch (error) {
        window.location.href = '/login';
      }
    };
    
    checkSuperAdmin();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">Checking authorization...</div>;
  }

  const navItems = [
    { name: 'Overview', href: '/super-admin', icon: LayoutDashboard },
    { name: 'Tenants', href: '/super-admin/tenants', icon: Building2 },
    { name: 'Plans', href: '/super-admin/plans', icon: Package },
    { name: 'Billing', href: '/super-admin/billing', icon: CreditCard },
    { name: 'Bank Transfers', href: '/super-admin/bank-transfers', icon: CreditCard },
    { name: 'Users', href: '/super-admin/users', icon: Users },
    { name: 'Settings', href: '/super-admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <img src="/logo.png" alt="QR Dine Logo" className="h-[100px] w-auto max-w-[200px] object-contain mr-3 -my-6" />
          <div style={{ display: 'none' }} className="w-8 h-8 bg-gradient-to-br from-orange-400 to-rose-500 rounded-lg items-center justify-center font-bold mr-3 shadow-lg">
            Q
          </div>
          <span className="font-extrabold text-lg tracking-wide">Super Admin</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('tenant_token');
                document.cookie = 'tenant_token=; path=/; max-age=0; SameSite=Lax';
                window.location.href = '/login';
              }
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all font-medium text-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          <h1 className="font-bold text-slate-800 capitalize text-lg">
            {navItems.find(i => i.href === pathname)?.name || 'Dashboard'}
          </h1>
          
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right hidden sm:block">
                <div className="font-bold text-sm text-slate-800">System Admin</div>
                <div className="text-xs text-slate-500 font-medium">Super Admin</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                S
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1 overflow-auto bg-slate-50">
          {children}
        </div>

      </main>
    </div>
  );
}
