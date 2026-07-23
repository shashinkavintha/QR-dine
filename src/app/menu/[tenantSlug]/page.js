"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Info, X, Plus, ShoppingBag, Loader2, Image as ImageIcon, Trash2, ArrowRight, CheckCircle2, Clock, MapPin, ChefHat, Ban, Bell, Star, Sparkles } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';

import LanguageSelector from '@/components/menu/LanguageSelector';
import CallWaiterModal from '@/components/menu/CallWaiterModal';
import ReviewModal from '@/components/menu/ReviewModal';
import UpsellDrawer from '@/components/menu/UpsellDrawer';

export default function CustomerMenuSPA() {
  const params = useParams(); // params.tenantSlug
  const searchParams = useSearchParams();
  const tableId = searchParams.get('table');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tenantData, setTenantData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [rawCategories, setRawCategories] = useState([]);
  const [rawItems, setRawItems] = useState([]);
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPortion, setSelectedPortion] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrderDetails, setActiveOrderDetails] = useState(null);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isOrderBannerDismissed, setIsOrderBannerDismissed] = useState(false);

  // M4 States
  const [currentLang, setCurrentLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState({});
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [upsellState, setUpsellState] = useState({
    isOpen: false,
    sourceItemName: '',
    suggestedItem: null
  });
  const [cartUpsellItems, setCartUpsellItems] = useState([]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setQuantity(1);
    setSelectedModifiers([]);
    if (Array.isArray(item?.portions) && item.portions.length > 0) {
      setSelectedPortion(item.portions[0]);
    } else {
      setSelectedPortion(null);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOrderId = localStorage.getItem('active_order_id');
      if (savedOrderId) setActiveOrderId(savedOrderId);
    }
  }, []);

  useEffect(() => {
    let echoInstance = null;
    let timeoutId = null;

    const setupOrderStatus = async () => {
      if (!activeOrderId) return;
      
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/public/orders/${activeOrderId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveOrderDetails(data.order);
          
          if (['served', 'completed', 'cancelled'].includes(data.order.status)) {
            if (data.order.status === 'completed' || data.order.status === 'served') {
              setIsReviewModalOpen(true);
            }
            localStorage.removeItem('active_order_id');
            timeoutId = setTimeout(() => {
              setActiveOrderId(null);
              setActiveOrderDetails(null);
            }, 10000);
            return;
          }
        } else if (res.status === 404) {
          localStorage.removeItem('active_order_id');
          setActiveOrderId(null);
          return;
        }

        // Setup Echo listener if not completed
        const { default: getEcho } = await import('@/lib/echo');
        echoInstance = getEcho(); // Public channel doesn't need auth token
        
        echoInstance.channel(`order.${activeOrderId}`)
          .listen('.App\\Events\\OrderStatusUpdated', (e) => {
            setActiveOrderDetails(e.order);
            if (['served', 'completed', 'cancelled'].includes(e.order.status)) {
              if (e.order.status === 'completed' || e.order.status === 'served') {
                setIsReviewModalOpen(true);
              }
              localStorage.removeItem('active_order_id');
              timeoutId = setTimeout(() => {
                setActiveOrderId(null);
                setActiveOrderDetails(null);
              }, 10000);
            }
          });
      } catch (e) {
        console.error('Error fetching order status:', e);
      }
    };

    setupOrderStatus();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (echoInstance) {
        echoInstance.disconnect();
      }
    };
  }, [activeOrderId]);

  useEffect(() => {
    let isFirstLoad = true;
    
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/menu/${params.tenantSlug}`, { cache: 'no-store' });
        if (!res.ok) {
          if (res.status === 403) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'This menu is currently unavailable.');
          }
          throw new Error('Menu not found');
        }
        const data = await res.json();
        
        setError(null);
        setTenantData(data.branding);
        
        // Always update categories & items on first load
        if (isFirstLoad) {
          const allItems = [];
          data.menu?.forEach(cat => {
            if (cat.items) cat.items.forEach(item => allItems.push(item));
          });
          setRawCategories(data.menu || []);
          setRawItems(allItems);
          setCategories(data.menu || []);
          setItems(allItems);
          setTranslationCache({
            en: { categories: data.menu || [], items: allItems }
          });
          if (data.menu && data.menu.length > 0) {
            setActiveCategory(data.menu[0].id);
          }
          isFirstLoad = false;
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchMenu();
    // Poll every 30 seconds to check if menu was suspended or expired
    const interval = setInterval(fetchMenu, 30000);
    return () => clearInterval(interval);
  }, [params.tenantSlug]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeCategory, searchQuery]);

  const handleLanguageChange = async (targetLang) => {
    if (targetLang === currentLang) return;

    if (translationCache[targetLang]) {
      setCategories(translationCache[targetLang].categories);
      setItems(translationCache[targetLang].items);
      setCurrentLang(targetLang);
      toast.success(`Translated to ${targetLang.toUpperCase()}`);
      return;
    }

    setIsTranslating(true);
    try {
      const texts = [];
      rawCategories.forEach(cat => texts.push(cat.name));
      rawItems.forEach(item => {
        texts.push(item.name);
        texts.push(item.description || '');
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/public/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, target_lang: targetLang })
      });

      if (res.ok) {
        const data = await res.json();
        const translations = data.translations || data.translated_texts || [];
        let idx = 0;

        const translatedCategories = rawCategories.map(cat => ({
          ...cat,
          name: translations[idx++] || cat.name
        }));

        const translatedItems = rawItems.map(item => ({
          ...item,
          name: translations[idx++] || item.name,
          description: translations[idx++] || item.description
        }));

        setTranslationCache(prev => ({
          ...prev,
          [targetLang]: { categories: translatedCategories, items: translatedItems }
        }));
        setCategories(translatedCategories);
        setItems(translatedItems);
        setCurrentLang(targetLang);
        toast.success(`Translated to ${targetLang.toUpperCase()}`);
      } else {
        toast.error('Translation failed.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error translating menu.');
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleModifier = (option) => {
    const exists = selectedModifiers.find(m => m.name === option.name);
    if (exists) {
      setSelectedModifiers(selectedModifiers.filter(m => m.name !== option.name));
    } else {
      setSelectedModifiers([...selectedModifiers, option]);
    }
  };

  const addToCart = async () => {
    if (!selectedItem) return;
    const itemToAdd = selectedItem;
    const basePrice = selectedPortion ? selectedPortion.price : selectedItem.price;
    const modifiersTotal = selectedModifiers.reduce((acc, mod) => acc + parseFloat(mod.price), 0);
    const cartItem = {
      id: Math.random().toString(36).substr(2, 9),
      menu_item_id: selectedItem.id,
      name: selectedItem.name,
      quantity,
      unit_price: parseFloat(basePrice) + modifiersTotal,
      portion: selectedPortion ? selectedPortion.name : null,
      modifiers: selectedModifiers,
      image_url: selectedItem.image_url
    };
    
    setCart([...cart, cartItem]);
    setSelectedItem(null);
    toast.success('Added to order!', {
      style: {
        borderRadius: '100px',
        background: '#333',
        color: '#fff',
        fontWeight: 'bold',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#333',
      },
    });

    // R4: Query Upsell Suggestions for the added item
    try {
      const tenantId = tenantData?.user_id;
      if (tenantId && itemToAdd?.id) {
        let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/public/upsell-suggestions?tenant_id=${tenantId}&item_ids[]=${itemToAdd.id}`);
        if (!res.ok) {
          res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/public/upsell?tenant_id=${tenantId}&item_ids[]=${itemToAdd.id}`);
        }
        if (res.ok) {
          const suggestions = await res.json();
          if (Array.isArray(suggestions) && suggestions.length > 0) {
            setUpsellState({
              isOpen: true,
              sourceItemName: itemToAdd.name,
              suggestedItem: suggestions[0]
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch upsell suggestions:', err);
    }
  };

  const addToCartFromUpsell = (suggestedItem) => {
    const cartItem = {
      id: Math.random().toString(36).substr(2, 9),
      menu_item_id: suggestedItem.id,
      name: suggestedItem.name,
      quantity: 1,
      unit_price: parseFloat(suggestedItem.price || 0),
      portion: null,
      modifiers: [],
      image_url: suggestedItem.image_url
    };
    setCart(prev => [...prev, cartItem]);
    toast.success(`Added ${suggestedItem.name} to order!`, {
      style: {
        borderRadius: '100px',
        background: '#333',
        color: '#fff',
        fontWeight: 'bold',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#333',
      },
    });
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  useEffect(() => {
    const fetchCartUpsells = async () => {
      const tenantId = tenantData?.user_id;
      if (!tenantId || cart.length === 0) {
        setCartUpsellItems([]);
        return;
      }
      try {
        const itemIds = cart.map(i => i.menu_item_id).filter(Boolean);
        const query = itemIds.map(id => `item_ids[]=${id}`).join('&');
        let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/public/upsell-suggestions?tenant_id=${tenantId}&${query}`);
        if (!res.ok) {
          res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/public/upsell?tenant_id=${tenantId}&${query}`);
        }
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const inCartIds = new Set(cart.map(c => c.menu_item_id));
            setCartUpsellItems(data.filter(item => !inCartIds.has(item.id)));
          }
        }
      } catch (err) {
        console.error('Failed to fetch cart upsells:', err);
      }
    };
    if (isCartOpen) {
      fetchCartUpsells();
    }
  }, [cart, isCartOpen, tenantData?.user_id]);

  const cartTotal = cart.reduce((total, item) => total + (item.unit_price * item.quantity), 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setPlacingOrder(true);
    try {
      const payload = {
        tenant_id: tenantData?.user_id,
        table_id: tableId,
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          portion: item.portion,
          modifiers: item.modifiers
        }))
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/public/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setCart([]);
        setIsCartOpen(false);
        setOrderPlaced(true);
        if (data.order && data.order.id) {
          setActiveOrderId(data.order.id);
          localStorage.setItem('active_order_id', data.order.id);
        }
        setTimeout(() => setOrderPlaced(false), 5000);
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.error || 'Failed to place order. Please try again.');
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred while placing your order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Banner Skeleton */}
      <div className="relative h-48 md:h-64 bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
      <div className="px-4 md:px-8 -mt-12 relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-slate-300 dark:bg-slate-700 rounded-[2rem] border-4 border-white dark:border-slate-950 shadow-sm animate-pulse mb-4"></div>
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mb-2"></div>
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6"></div>
      </div>
      
      {/* Categories Skeleton */}
      <div className="px-4 md:px-8 mb-8 flex gap-3 overflow-x-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 w-28 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem] animate-pulse shrink-0"></div>
        ))}
      </div>

      {/* Items Grid Skeleton */}
      <div className="px-4 md:px-8 pb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] p-4 flex gap-4 h-[140px] animate-pulse border border-slate-100 dark:border-slate-800/50 shadow-sm">
            <div className="w-28 h-full bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0"></div>
            <div className="flex-1 flex flex-col justify-center gap-2">
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (error || !tenantData) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 selection:bg-orange-500 selection:text-white">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2rem] shadow-xl text-center border border-slate-100 dark:border-slate-800/50">
        <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Ban size={40} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-3">Menu Unavailable</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
          {error === 'Menu not found' ? "We couldn't find a menu at this address. Please check the link or scan the QR code again." : error}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-slate-900 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all w-full"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const filteredItems = items.filter(item => {
    const matchesCategory = item.category_id === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return searchQuery ? matchesSearch : matchesCategory;
  });

  const branding = {
    restaurant_name: tenantData.restaurant_name || 'Restaurant',
    primary_color: tenantData.primary_color || '#f97316',
    secondary_color: tenantData.secondary_color || '#1e293b',
    logo_url: tenantData.logo_url,
    banner_url: tenantData.banner_url,
    currency: tenantData.currency || 'Rs. ',
    theme_mode: tenantData.theme_mode || 'light'
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${url}`;
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-black/10 flex flex-col transition-colors duration-300 ${branding.theme_mode === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'force-light bg-slate-50 text-slate-800'}`} style={{ '--theme-primary': branding.primary_color }}>
      <Toaster position="bottom-center" />
      
      {/* Success Notification */}
      <AnimatePresence>
        {orderPlaced && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 size={20} />
            Order placed successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Order Banner */}
      <AnimatePresence>
        {activeOrderId && activeOrderDetails && !isOrderBannerDismissed && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 md:right-8 z-40 flex items-center gap-2"
          >
            <button 
              onClick={() => setIsOrderTrackingOpen(true)}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 hover:bg-white dark:bg-slate-900 transition-all group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-20"></div>
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center relative z-10">
                  {activeOrderDetails.status === 'pending' && <Clock size={20} />}
                  {activeOrderDetails.status === 'preparing' && <ChefHat size={20} />}
                  {(activeOrderDetails.status === 'served' || activeOrderDetails.status === 'completed') && <CheckCircle2 size={20} />}
                </div>
              </div>
              <div className="text-left pr-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Active Order</p>
                <p className="text-sm font-extrabold capitalize" style={{ color: branding.primary_color }}>
                  {activeOrderDetails.status}
                </p>
              </div>
            </button>
            <button 
              onClick={() => setIsOrderBannerDismissed(true)}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-2 rounded-full shadow-xl hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 transition-colors"
              title="Dismiss notification"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Branding */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
      >
        {branding.banner_url && (
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-black/50 mix-blend-multiply z-10"></div>
            <img src={getImageUrl(branding.banner_url)} className="w-full h-full object-cover" alt="Banner" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 md:pt-16 md:pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div 
                className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg overflow-hidden bg-white/20 dark:bg-slate-900/40 border-2 ${branding.banner_url ? 'border-white/30' : 'border-slate-100 dark:border-slate-800/50'}`}
                style={{ backgroundColor: !branding.banner_url ? branding.primary_color : undefined }}
              >
                {branding.logo_url ? (
                   <img src={getImageUrl(branding.logo_url)} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                   <span className="text-2xl">{branding.restaurant_name.substring(0,2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className={`font-extrabold text-2xl md:text-3xl lg:text-4xl leading-tight ${branding.banner_url ? 'text-white drop-shadow-md' : 'text-slate-800 dark:text-slate-100'}`}>
                  {branding.restaurant_name}
                </h1>
                <p className={`text-sm font-medium mt-1 ${branding.banner_url ? 'text-white/90 drop-shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                  {tableId ? `Table Menu` : 'Digital Menu'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {/* Actions: Language Selector, Call Waiter, Review */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <LanguageSelector
                  currentLang={currentLang}
                  onLanguageChange={handleLanguageChange}
                  isTranslating={isTranslating}
                  bannerUrl={branding.banner_url}
                />

                <button
                  onClick={() => setIsWaiterModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all ${
                    branding.banner_url
                      ? 'bg-white/20 dark:bg-slate-900/40 border-white/30 text-white backdrop-blur-md hover:bg-white/30'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Call Waiter / Service Request"
                >
                  <Bell size={16} className="text-orange-500" />
                  <span>Call Waiter</span>
                </button>

                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all ${
                    branding.banner_url
                      ? 'bg-white/20 dark:bg-slate-900/40 border-white/30 text-white backdrop-blur-md hover:bg-white/30'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Leave a Review"
                >
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  <span>Review</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64 md:w-80 shrink-0">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${branding.banner_url ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`} size={20} />
                <input 
                  type="text" 
                  placeholder="Search for dishes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-opacity-20 transition-all ${
                    branding.banner_url 
                    ? 'bg-white/20 dark:bg-slate-900/40 border border-white/30 text-white placeholder:text-white/70 backdrop-blur-md focus:bg-white/30 dark:focus:bg-slate-900/60' 
                    : 'bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white dark:bg-slate-900 focus:border-slate-300 dark:border-slate-600'
                  }`}
                  style={{ '--tw-ring-color': branding.banner_url ? 'white' : branding.primary_color }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {!searchQuery && categories.length > 0 && (
          <div className="md:w-64 shrink-0">
            <div className="hidden md:flex flex-col gap-2 sticky top-8">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-xs mb-3 ml-2">Categories</h3>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-all duration-200 ${
                    activeCategory === cat.id 
                    ? 'text-white shadow-md transform translate-x-2' 
                    : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'
                  }`}
                  style={{ backgroundColor: activeCategory === cat.id ? branding.secondary_color : '' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sticky top-0 z-20 bg-slate-50 dark:bg-slate-950/90 backdrop-blur-md">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-sm ${
                    activeCategory === cat.id 
                    ? 'text-white scale-[1.02]' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950'
                  }`}
                  style={{ backgroundColor: activeCategory === cat.id ? branding.secondary_color : '' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 pb-24">
          {searchQuery && (
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Search results for "{searchQuery}"
            </h2>
          )}

          {!searchQuery && activeCategory && (
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 hidden md:block">
              {categories.find(c => c.id === activeCategory)?.name}
            </h2>
          )}

          <AnimatePresence mode="wait">
            <motion.div 
              key={searchQuery ? 'search' : activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
            >
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-5 shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-row md:flex-col gap-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="w-28 h-28 md:w-full md:h-48 bg-slate-50 dark:bg-slate-950 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800/50 relative shadow-inner">
                    {item.image_url ? (
                      <img src={getImageUrl(item.image_url)} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                        <ImageIcon size={24} />
                        <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest">No Photo</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 w-8 h-8 md:w-10 md:h-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-full shadow flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                      <Plus size={18} className="md:w-5 md:h-5" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1 md:py-0">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-lg leading-tight mb-1 md:mb-2 truncate md:whitespace-normal md:line-clamp-2">{item.name}</h3>
                      {item.description && (
                        <p className="text-[13px] md:text-sm text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="font-extrabold text-[15px] md:text-lg mt-3" style={{ color: branding.primary_color }}>
                      {Array.isArray(item.portions) && item.portions.length > 0
                        ? `From ${branding.currency?.trim()} ${Math.min(...item.portions.map(p => parseFloat(p.price))).toFixed(2)}`
                        : `${branding.currency?.trim()} ${parseFloat(item.price || 0).toFixed(2)}`
                      }
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm mt-4">
              <Search className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No items found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Try adjusting your search or category.</p>
            </div>
          )}
        </main>
      </div>

      {/* Floating Call Waiter Button */}
      <div className="fixed bottom-6 left-4 sm:left-6 z-40">
        <button
          onClick={() => setIsWaiterModalOpen(true)}
          className="p-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: branding.primary_color }}
          title="Call Waiter / Service Request"
        >
          <Bell size={20} />
          <span className="hidden sm:inline">Call Waiter</span>
        </button>
      </div>

      {/* Floating View Order Button */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 inset-x-0 w-full max-w-md mx-auto px-4 z-40 flex gap-2"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex-1 flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-white shadow-2xl shadow-black/20 backdrop-blur-md transition-transform active:scale-95"
              style={{ backgroundColor: branding.primary_color }} 
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/25 dark:bg-slate-900/40 flex items-center justify-center text-sm">{cart.length}</div>
                <span>{cartTotal > 0 ? 'View Order' : 'Cart Empty'}</span>
              </div>
              <span>{branding.currency?.trim()} {cartTotal.toFixed(2)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Details Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            {/* Backdrop */}
            <motion.div
              key={`item-backdrop-${selectedItem.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => handleSelectItem(null)}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            />
            {/* Card */}
            <motion.div
              key={`item-card-${selectedItem.id}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              onClick={() => handleSelectItem(null)}
              className="fixed inset-0 z-50 p-4 md:p-8 flex items-end md:items-center justify-center"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] z-50 overflow-hidden shadow-2xl relative h-[85vh] md:h-[90vh] flex flex-col"
              >
                {/* Close Button */}
                <button 
                  onClick={() => handleSelectItem(null)}
                  className="absolute top-4 right-4 z-30 w-10 h-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white dark:bg-slate-900 transition-colors"
                >
                  <X size={20} />
                </button>

                {/* SCROLLABLE BODY */}
                <div 
                  className="flex-1 overflow-y-auto overflow-x-hidden relative"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                  data-lenis-prevent="true"
                >

                  {/* Image */}
                  <div className="h-64 sm:h-72 w-full bg-slate-100 dark:bg-slate-800 relative shrink-0">
                    {selectedItem.image_url ? (
                      <img src={getImageUrl(selectedItem.image_url)} alt={selectedItem.name} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                        <ImageIcon size={48} className="mb-3 opacity-50" />
                        <span className="font-bold text-sm uppercase tracking-widest">No Photo Available</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-8 flex flex-col">
                    <div className="flex flex-col gap-2 mb-4">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">{selectedItem.name}</h2>
                      <div className="font-bold text-xl" style={{ color: branding.primary_color }}>
                        {branding.currency?.trim()} {(parseFloat(selectedPortion ? selectedPortion.price : (selectedItem.price || 0)) + selectedModifiers.reduce((acc, mod) => acc + parseFloat(mod.price), 0)).toFixed(2)}
                      </div>
                    </div>

                    {Array.isArray(selectedItem?.portions) && selectedItem.portions.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wider">Select Portion</h4>
                        <div className="flex flex-wrap gap-3">
                          {selectedItem.portions.map((portion, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedPortion(portion)}
                              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                                selectedPortion?.name === portion.name
                                  ? 'border-transparent text-white shadow-md shadow-black/10'
                                  : 'border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950'
                              }`}
                              style={selectedPortion?.name === portion.name ? { backgroundColor: branding.primary_color } : {}}
                            >
                              <div className="flex-1">
                                <span className="block font-bold">{portion.name}</span>
                                <span className="block text-xs opacity-80 font-medium">{branding.currency?.trim()} {parseFloat(portion.price).toFixed(2)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(selectedItem?.modifiers) && selectedItem.modifiers.length > 0 && (
                      <div className="mb-6 space-y-4">
                        {selectedItem.modifiers.map((modGroup, gIdx) => (
                          <div key={gIdx}>
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wider">{modGroup.name}</h4>
                            <div className="flex flex-col gap-2">
                              {modGroup.options?.map((option, oIdx) => {
                                const isSelected = selectedModifiers.some(m => m.name === option.name);
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => toggleModifier(option)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                      isSelected
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                                        : 'border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 hover:border-slate-200 dark:border-slate-700'
                                    }`}
                                    style={isSelected ? { borderColor: branding.primary_color } : {}}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className={`w-5 h-5 rounded flex items-center justify-center ${isSelected ? 'bg-orange-500 text-white' : 'border-2 border-slate-300 dark:border-slate-600'}`}
                                        style={isSelected ? { backgroundColor: branding.primary_color } : {}}
                                      >
                                        {isSelected && <CheckCircle2 size={14} />}
                                      </div>
                                      <span className={`font-medium ${isSelected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>{option.name}</span>
                                    </div>
                                    <span className="text-xs opacity-70 font-medium">
                                      + {branding.currency?.trim()} {parseFloat(option.price).toFixed(2)}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedItem.description && (
                      <p className="text-slate-500 dark:text-slate-400 text-[15px] md:text-base leading-relaxed pb-4">
                        {selectedItem.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* FIXED FOOTER */}
                <div 
                  className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-4 shrink-0 z-20"
                >
                  <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 rounded-2xl p-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 shadow-sm font-bold text-xl active:scale-95 transition-transform">-</button>
                    <span className="font-bold text-slate-800 dark:text-slate-100 w-6 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 shadow-sm font-bold text-xl active:scale-95 transition-transform">+</button>
                  </div>
                  <button onClick={addToCart} className="w-full sm:flex-1 py-3 sm:py-4 h-[48px] sm:h-[64px] rounded-xl text-white font-bold text-lg flex items-center justify-between px-6 shadow-lg active:scale-[0.98] transition-transform" style={{ backgroundColor: branding.secondary_color }}>
                    <span>Add to Order</span>
                    <span>{branding.currency?.trim()} {((parseFloat(selectedPortion ? selectedPortion.price : (selectedItem.price || 0)) + selectedModifiers.reduce((acc, mod) => acc + parseFloat(mod.price), 0)) * quantity).toFixed(2)}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
          />
        )}
        {isCartOpen && (
          <motion.div 
            key="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
          >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  <ShoppingBag size={24} style={{ color: branding.primary_color }} />
                  Your Order
                </h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Your cart is empty.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                        {item.image_url ? (
                          <img src={getImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><ImageIcon size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{item.name}</h4>
                        {item.portion && <p className="text-xs text-slate-500 dark:text-slate-400">{item.portion}</p>}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            + {item.modifiers.map(m => m.name).join(', ')}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-sm font-bold mt-1" style={{ color: branding.primary_color }}>
                            {branding.currency?.trim()} {item.unit_price.toFixed(2)} x {item.quantity}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}

                {cart.length > 0 && cartUpsellItems.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Suggested Add-ons
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {cartUpsellItems.map(sugItem => (
                        <div key={sugItem.id} className="flex items-center justify-between p-3 rounded-2xl bg-orange-50/50 dark:bg-slate-800/50 border border-orange-100 dark:border-slate-700/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                              {sugItem.image_url ? (
                                <img src={getImageUrl(sugItem.image_url)} alt={sugItem.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><ImageIcon size={16} /></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">{sugItem.name}</p>
                              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                                {branding.currency?.trim()} {parseFloat(sugItem.price || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => addToCartFromUpsell(sugItem)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 transition shrink-0 flex items-center gap-1"
                            style={{ backgroundColor: branding.primary_color }}
                          >
                            <Plus size={14} /> Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-slate-500 font-medium dark:text-slate-400">Total Amount</span>
                    <span className="font-extrabold text-xl" style={{ color: branding.primary_color }}>
                      {branding.currency?.trim()} {cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <button 
                    onClick={placeOrder}
                    disabled={placingOrder}
                    className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-70"
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    {placingOrder ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        Place Order <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                    By placing this order, you agree to pay at the counter/table.
                  </p>
                </div>
              )}
            </motion.div>
        )}
      </AnimatePresence>

      {/* Order Tracking Modal */}
      <AnimatePresence>
        {isOrderTrackingOpen && activeOrderDetails && (
          <motion.div 
            key="tracking-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOrderTrackingOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Order Status</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Order #{activeOrderDetails.id}</p>
                  </div>
                  <button 
                    onClick={() => setIsOrderTrackingOpen(false)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-700 transition shadow-sm relative z-10"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto">
                  {/* Status Timeline */}
                  <div className="flex items-center justify-between mb-8 relative">
                    <div className="absolute left-6 right-6 top-1/2 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0 rounded-full"></div>
                    
                    {/* Pending Node */}
                    <div className="flex flex-col items-center gap-2 relative z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-colors ${['pending', 'preparing', 'served'].includes(activeOrderDetails.status) ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>
                        <Clock size={20} />
                      </div>
                      <span className={`text-xs font-bold ${['pending', 'preparing', 'served'].includes(activeOrderDetails.status) ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>Pending</span>
                    </div>

                    {/* Preparing Node */}
                    <div className="flex flex-col items-center gap-2 relative z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-colors ${['preparing', 'served'].includes(activeOrderDetails.status) ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>
                        <ChefHat size={20} />
                      </div>
                      <span className={`text-xs font-bold ${['preparing', 'served'].includes(activeOrderDetails.status) ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>Preparing</span>
                    </div>

                    {/* Served Node */}
                    <div className="flex flex-col items-center gap-2 relative z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-colors ${activeOrderDetails.status === 'served' ? 'bg-green-500 text-white' : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>
                        <CheckCircle2 size={20} />
                      </div>
                      <span className={`text-xs font-bold ${activeOrderDetails.status === 'served' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>Served</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50 mb-6">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Order Items</h3>
                    <div className="space-y-4">
                      {activeOrderDetails.items?.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                              {item.quantity}x {item.menu_item?.name || 'Item'}
                            </p>
                            {item.portion && <p className="text-xs text-slate-500 dark:text-slate-400">{item.portion}</p>}
                            {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                + {item.selected_modifiers.map(m => m.name).join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="font-bold text-sm" style={{ color: branding.primary_color }}>
                            {branding.currency?.trim()} {(item.quantity * item.unit_price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeOrderDetails.status === 'served' && (
                    <button 
                      onClick={() => {
                        localStorage.removeItem('active_order_id');
                        setActiveOrderId(null);
                        setIsOrderTrackingOpen(false);
                      }}
                      className="w-full py-4 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 transition-colors"
                    >
                      Dismiss Tracking
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* M4 Modals & Drawers */}
      <CallWaiterModal
        isOpen={isWaiterModalOpen}
        onClose={() => setIsWaiterModalOpen(false)}
        tenantId={tenantData?.user_id}
        tableId={tableId}
        branding={branding}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        tenantId={tenantData?.user_id}
        branding={branding}
      />

      <UpsellDrawer
        isOpen={upsellState.isOpen}
        onClose={() => setUpsellState(prev => ({ ...prev, isOpen: false }))}
        sourceItemName={upsellState.sourceItemName}
        suggestedItem={upsellState.suggestedItem}
        onAddToCart={addToCartFromUpsell}
        branding={branding}
      />
    </div>
  );
}
