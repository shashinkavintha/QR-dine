"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  QrCode, 
  Palette, 
  BarChart3,
  CreditCard,
  LogOut,
  Menu,
  ShoppingBag,
  ScanLine,
  User,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Users,
  History,
  Star,
  Sparkles
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { fetchWithAuth } from '@/utils/api';
import toast from 'react-hot-toast';

export default function TenantDashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [ordersCount, setOrdersCount] = useState(0);
  const maxOrderIdRef = useRef(null);
  const [tenantName, setTenantName] = useState('Hotel Admin');
  const [tenantInitials, setTenantInitials] = useState('H');
  const [tenantPlan, setTenantPlan] = useState('Free Trial');
  const [tenantStatus, setTenantStatus] = useState('trialing');
  const [isSuspended, setIsSuspended] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [hasAnalytics, setHasAnalytics] = useState(false);

  // Volume state
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedVolume = localStorage.getItem('notificationVolume');
    const savedMuted = localStorage.getItem('notificationMuted');
    if (savedVolume !== null) setVolume(parseFloat(savedVolume));
    if (savedMuted !== null) setIsMuted(savedMuted === 'true');
  }, []);

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    localStorage.setItem('notificationVolume', newVol);
    setIsMuted(newVol === 0);
    localStorage.setItem('notificationMuted', newVol === 0);
    
    // Play test sound
    const audioEl = document.getElementById('notification-sound');
    if (audioEl && newVol > 0) {
      audioEl.volume = newVol;
      audioEl.currentTime = 0;
      audioEl.play().catch(err => console.log(err));
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('notificationMuted', newMuted);
    if (!newMuted && volume === 0) {
      setVolume(0.5);
      localStorage.setItem('notificationVolume', 0.5);
    }
  };

  useEffect(() => {
    // Unlock HTML5 Audio on first interaction
    const unlockAudio = () => {
      const audioEl = document.getElementById('notification-sound');
      if (audioEl) {
        const origMuted = audioEl.muted;
        audioEl.muted = true;
        audioEl.play().then(() => {
          audioEl.pause();
          audioEl.currentTime = 0;
          audioEl.muted = origMuted;
        }).catch(err => {
          console.log('Audio unlock failed:', err);
          audioEl.muted = origMuted;
        });
      }
    };
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });

    const playNotificationSound = () => {
      const audioEl = document.getElementById('notification-sound');
      if (audioEl && !isMuted) {
        audioEl.volume = volume;
        audioEl.currentTime = 0;
        audioEl.play().catch(err => console.log('Audio playback blocked:', err));
      }
    };

    const fetchOrdersCount = async () => {
      try {
        const res = await fetchWithAuth('/api/tenant/orders');
        const data = await res.json();
        const fetchedOrders = Array.isArray(data) ? data : [];
        const pendingOrders = fetchedOrders.filter(o => o.status === 'pending');
        setOrdersCount(pendingOrders.length);
        
        if (fetchedOrders.length > 0) {
          const pendingIds = pendingOrders.map(o => o.id);
          
          if (maxOrderIdRef.current !== null) {
            const hasNewOrder = pendingIds.some(id => !maxOrderIdRef.current.has(id));
            if (hasNewOrder) {
              playNotificationSound();
              toast.success('New Order Received!', {
                duration: 5000,
                icon: '🔔',
                style: { background: '#0f172a', color: '#fff', fontWeight: 'bold' },
              });
            }
          }
          maxOrderIdRef.current = new Set(pendingIds);
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    const fetchTenantDetails = async () => {
      try {
        const resSettings = await fetchWithAuth('/api/tenant/settings');
        const data = await resSettings.json();
        
        if (data.settings && data.settings.restaurant_name) {
          setTenantName(data.settings.restaurant_name);
          setTenantInitials(data.settings.restaurant_name.substring(0, 2).toUpperCase());
        }

        if (data.user) {
          setTenantPlan(data.user.plan_name);
          setTenantStatus(data.user.status || 'trialing');
          setIsSuspended(data.user.status === 'suspended');
          setIsExpired(data.user.is_expired);
          setDaysLeft(data.user.days_left);
          setUserRole(data.user.role || 'tenant');
          setUserPermissions(data.user.permissions || []);
          setHasAnalytics(data.user.has_analytics || false);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchOrdersCount();
    fetchTenantDetails();

    let echoInstance = null;
    const setupEcho = async () => {
      const token = localStorage.getItem('tenant_token');
      if (!token) return;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const tenantId = payload.tenant_id || payload.sub;

        import('@/lib/echo').then(({ default: getEcho }) => {
          try {
            const echo = getEcho(token);
            echoInstance = echo;
            
            echo.private(`tenant.status.${tenantId}`)
              .listen('TenantStatusUpdated', (e) => {
                setIsSuspended(e.is_suspended);
              });

            echo.private(`tenant.orders.${tenantId}`)
              .listen('.App\\Events\\OrderCreated', () => {
                fetchOrdersCount();
              })
              .listen('.App\\Events\\OrderStatusUpdated', () => {
                fetchOrdersCount();
              });
          } catch (err) {
            console.error("Echo setup failed:", err);
          }
        });
      } catch (err) {
        console.error("Token parse failed:", err);
      }
    };
    
    setupEcho();

    return () => {
      if (echoInstance) {
        echoInstance.disconnect();
      }
    };
  }, [isMuted, volume]);

  const allNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBag, badge: ordersCount, permission: 'view_orders' },
    { name: 'Menu Management', href: '/dashboard/menu', icon: UtensilsCrossed, permission: 'manage_menu' },
    { name: 'Upsell Rules', href: '/dashboard/upsell', icon: Sparkles, permission: 'manage_upsells' },
    { name: 'Reviews', href: '/dashboard/reviews', icon: Star, permission: 'manage_reviews' },
    { name: 'Tables & QRs', href: '/dashboard/tables', icon: ScanLine, permission: 'manage_settings' },
    { name: 'Branding & Theme', href: '/dashboard/branding', icon: Palette, permission: 'manage_settings' },
    { name: 'Staff & Roles', href: '/dashboard/staff', icon: Users, permission: 'manage_staff' },
    { name: 'Activity Log', href: '/dashboard/activity', icon: History, permission: 'view_analytics' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, permission: 'view_analytics' },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard, permission: 'manage_billing' },
    { name: 'Profile Settings', href: '/dashboard/profile', icon: User },
  ];

  const navItems = allNavItems.filter(item => {
    // If it's the analytics tab, check the plan limit first
    if (item.name === 'Analytics') {
      if (!hasAnalytics) return false;
    }

    if (userRole === 'tenant') return true;
    if (!item.permission) return true;
    return userPermissions.includes(item.permission);
  });

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tenant_token');
      document.cookie = 'tenant_token=; path=/; max-age=0; SameSite=Lax';
      window.location.href = '/login';
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 flex font-sans text-slate-800 dark:text-slate-100">
      <audio id="notification-sound" src="/notification.wav" preload="auto"></audio>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/50">
          <img src="/logo.png" alt="QR Dine Logo" className="h-[100px] w-auto max-w-[200px] object-contain -my-6 dark:brightness-0 dark:invert" />
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive 
                  ? 'bg-orange-50 text-orange-600 shadow-sm dark:bg-orange-500/10 dark:text-orange-400' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  {item.name}
                </div>
                {item.badge > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            
            {/* Volume Control */}
            <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-900 rounded-xl">
               <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400">
                 {volume === 0 || isMuted ? (
                    <VolumeX size={18} className="cursor-pointer hover:text-orange-500 transition-colors" onClick={toggleMute} />
                 ) : (
                    <Volume2 size={18} className="cursor-pointer hover:text-orange-500 transition-colors" onClick={toggleMute} />
                 )}
                 <span className="text-sm font-medium">Sound</span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="1" 
                 step="0.1" 
                 value={isMuted ? 0 : volume} 
                 onChange={handleVolumeChange}
                 className="w-20 accent-orange-500 cursor-pointer"
               />
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-500/10 p-3 w-full rounded-xl transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-slate-800 dark:text-slate-100 text-lg hidden sm:block">
              {navItems.find(i => i.href === pathname)?.name || 'Tenant Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Dark Mode"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
            
            <div className="text-right hidden sm:block">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{tenantName}</div>
              {tenantStatus === 'trialing' ? (
                <div className="text-xs font-bold text-orange-500 uppercase tracking-wide">FREE TRIAL</div>
              ) : tenantStatus === 'active' ? (
                <div className="text-xs font-bold text-green-600 uppercase tracking-wide">{tenantPlan}</div>
              ) : (
                <div className="text-xs font-bold text-rose-600 uppercase tracking-wide">EXPIRED</div>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 uppercase">
              {tenantInitials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900 relative">
          {isSuspended && (
            <div className="bg-rose-500 text-white px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 shadow-sm z-40 sticky top-0">
              <span className="flex-shrink-0">⚠️</span>
              Your account is suspended. Your public menus are offline and modifications are disabled. Please contact support.
            </div>
          )}
          
          {isExpired && !isSuspended && (
            <div className="bg-amber-500 text-white px-4 py-3 text-sm font-medium flex items-center justify-between gap-2 shadow-sm z-40 sticky top-0">
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0">⚠️</span>
                Your subscription has expired. Your public menus are currently offline.
              </div>
              <Link href="/dashboard/billing" className="bg-white text-amber-600 px-3 py-1 rounded font-bold text-xs hover:bg-slate-50">
                Renew Now
              </Link>
            </div>
          )}

          {!isExpired && !isSuspended && daysLeft > 0 && daysLeft <= 7 && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 text-sm font-medium flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 z-40 sticky top-0">
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 bg-yellow-100 text-yellow-600 w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-lg">⚠️</span>
                </span>
                <p className="text-yellow-800">
                  <strong className="font-bold text-yellow-900">Warning:</strong> Your subscription expires in <span className="font-bold">{daysLeft}</span> days. Please renew your plan to avoid losing access to your QR Menu.
                </p>
              </div>
              <Link href="/dashboard/billing" className="bg-yellow-100 text-yellow-800 border border-yellow-300 px-4 py-2 rounded-lg font-bold text-xs hover:bg-yellow-200 transition-colors whitespace-nowrap">
                Renew Now
              </Link>
            </div>
          )}
          
          <div className={`flex-1 overflow-auto p-4 lg:p-8 ${isSuspended ? 'pointer-events-none opacity-70 grayscale-[30%]' : ''}`}>
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}
