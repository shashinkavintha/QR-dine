"use client";

import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '@/utils/api';
import toast from 'react-hot-toast';

export default function BrandingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [restaurantName, setRestaurantName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#f97316'); // Orange 500
  const [secondaryColor, setSecondaryColor] = useState('#1e293b'); // Slate 800
  const [currency, setCurrency] = useState('$');
  const [themeMode, setThemeMode] = useState('light');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [bannerUrl, setBannerUrl] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  
  const [menuCategories, setMenuCategories] = useState([]);

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, menuRes] = await Promise.all([
          fetchWithAuth('/api/tenant/settings'),
          fetchWithAuth('/api/tenant/menu')
        ]);
        
        const data = await settingsRes.json();
        const settings = data.settings || data;
        
        setRestaurantName(settings.restaurant_name || '');
        setPrimaryColor(settings.primary_color || '#f97316');
        setSecondaryColor(settings.secondary_color || '#1e293b');
        setLogoUrl(settings.logo_url || null);
        setBannerUrl(settings.banner_url || null);
        setCurrency(settings.currency || '$');
        setThemeMode(settings.theme_mode || 'light');
        setGoogleReviewUrl(settings.google_review_url || '');

        const menu = await menuRes.json();
        setMenuCategories(menu || []);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setLogoUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleBannerChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBannerFile(e.target.files[0]);
      setBannerUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('restaurant_name', restaurantName);
      formData.append('primary_color', primaryColor);
      formData.append('secondary_color', secondaryColor);
      formData.append('currency', currency);
      formData.append('theme_mode', themeMode);
      formData.append('google_review_url', googleReviewUrl);
      if (logoFile) formData.append('logo', logoFile);
      if (bannerFile) formData.append('banner', bannerFile);

      const res = await fetchWithAuth('/api/tenant/settings', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      setLogoUrl(data.logo_url || logoUrl);
      setBannerUrl(data.banner_url || bannerUrl);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;
  }

  // Determine active category for live preview
  const activeCategory = menuCategories.length > 0 ? menuCategories[0] : null;

  return (
    <div className="p-6 lg:p-8 max-w-7xl w-full pb-24 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Branding & Theme</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Customize how your menu looks to your customers.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 items-start">
        {/* Settings Form */}
        <div className="flex-1 w-full space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">Restaurant Identity</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Restaurant Name</label>
              <input 
                type="text" 
                value={restaurantName}
                onChange={e => setRestaurantName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors text-slate-900 dark:text-slate-100 shadow-sm" 
                placeholder="e.g. Grand Plaza Hotel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Google / TripAdvisor Review Link (google_review_url)</label>
              <input 
                type="url" 
                value={googleReviewUrl}
                onChange={e => setGoogleReviewUrl(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors text-slate-900 dark:text-slate-100 shadow-sm" 
                placeholder="e.g. https://g.page/r/your-google-review-link"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Direct review URL shown to customers submitting positive 4-5 star feedback.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Currency Symbol</label>
              <div className="relative">
                <select 
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors text-slate-900 dark:text-slate-100 shadow-sm appearance-none"
                >
                  <option value="$">$ (USD/AUD/CAD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="Rs">Rs (LKR/INR/PKR)</option>
                  <option value="₹">₹ (INR)</option>
                  <option value="¥">¥ (JPY/CNY)</option>
                  <option value="AED">AED</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Logo</label>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden shrink-0 shadow-sm">
                  {logoUrl ? (
                    <img src={logoUrl.startsWith('http') || logoUrl.startsWith('blob:') ? logoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${logoUrl}`} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={20} />
                  )}
                </div>
                <div>
                  <input type="file" className="hidden" ref={logoInputRef} onChange={handleLogoChange} accept="image/png, image/jpeg" />
                  <button onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors shadow-sm">
                    Upload Logo
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Max size 2MB. Recommended 512x512px.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Banner Image (Optional)</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden shrink-0 shadow-sm">
                  {bannerUrl ? (
                    <img src={bannerUrl.startsWith('http') || bannerUrl.startsWith('blob:') ? bannerUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${bannerUrl}`} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} />
                  )}
                </div>
                <div>
                  <input type="file" className="hidden" ref={bannerInputRef} onChange={handleBannerChange} accept="image/png, image/jpeg" />
                  <button onClick={() => bannerInputRef.current?.click()} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors shadow-sm">
                    Upload Banner
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[200px]">Appears as a subtle background header. Max size 2MB.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">Theme Settings</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 p-0 border-0 bg-transparent rounded-xl cursor-pointer" 
                  />
                  <input 
                    type="text" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-24 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 uppercase transition-colors shadow-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={secondaryColor} 
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 p-0 border-0 bg-transparent rounded-xl cursor-pointer" 
                  />
                  <input 
                    type="text" 
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-24 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 uppercase transition-colors shadow-sm" 
                  />
                </div>
              </div>

              <div className="col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Menu Theme Mode</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Choose whether your public menu appears in Light or Dark mode to your customers.</p>
                <div className="relative">
                  <select 
                    value={themeMode}
                    onChange={e => setThemeMode(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors text-slate-900 dark:text-slate-100 shadow-sm appearance-none"
                  >
                    <option value="light">Light Mode (Default)</option>
                    <option value="dark">Dark Mode</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-white transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:bg-slate-900 shadow-sm"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : null}
              Save Changes
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="w-full xl:w-[420px] shrink-0 sticky top-8">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-[3rem] p-8 flex items-center justify-center relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="absolute top-6 left-6 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Live Preview</div>
          
          {/* Mock Mobile Device */}
          <div className={`w-[320px] h-[640px] rounded-[2.5rem] shadow-xl border-[8px] border-slate-800 dark:border-slate-950 overflow-hidden relative flex flex-col ${themeMode === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 dark:bg-slate-950 rounded-b-2xl flex items-end justify-center pb-1 z-20">
              <div className="w-16 h-4 bg-black rounded-full"></div>
            </div>
            
            {/* Dynamic Header preview with Banner */}
            <div className="relative pt-14 pb-8 px-6 text-center text-white z-10" style={{ backgroundColor: primaryColor }}>
              {bannerUrl && (
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-black/40 mix-blend-multiply z-10"></div>
                  <img src={bannerUrl.startsWith('http') || bannerUrl.startsWith('blob:') ? bannerUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${bannerUrl}`} className="w-full h-full object-cover opacity-80" alt="Banner Preview" />
                </div>
              )}
              <div className="relative z-20">
                <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold border-2 border-white/30 overflow-hidden shadow-md">
                  {logoUrl ? (
                    <img src={logoUrl.startsWith('http') || logoUrl.startsWith('blob:') ? logoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${logoUrl}`} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    (restaurantName || 'GP').substring(0, 2).toUpperCase()
                  )}
                </div>
                <h1 className="text-xl font-extrabold shadow-sm">{restaurantName || 'Restaurant Name'}</h1>
                <p className="text-white/90 text-xs font-medium mt-1">Digital Menu</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
              {/* Categories */}
              <div className={`flex gap-2 p-4 overflow-x-auto scrollbar-hide border-b backdrop-blur-sm sticky top-0 z-10 ${themeMode === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-white/50 border-slate-100'}`}>
                {menuCategories.length > 0 ? menuCategories.map((cat, idx) => (
                  <div key={cat.id} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${idx === 0 ? 'text-white' : (themeMode === 'dark' ? 'text-slate-400 bg-slate-900 border border-slate-800' : 'text-slate-500 bg-white border border-slate-200')}`} style={{ backgroundColor: idx === 0 ? secondaryColor : '' }}>
                    {cat.name}
                  </div>
                )) : (
                  <>
                    <div className="px-4 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: secondaryColor }}>Starters</div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${themeMode === 'dark' ? 'text-slate-400 bg-slate-900 border border-slate-800' : 'text-slate-500 bg-white border border-slate-200'}`}>Main Course</div>
                  </>
                )}
              </div>

              {/* Items List */}
              <div className="p-4 space-y-3">
                {activeCategory && activeCategory.items ? activeCategory.items.map(item => (
                  <div key={item.id} className={`p-3 rounded-2xl shadow-sm border flex gap-3 ${themeMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${themeMode === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                       {item.image_url ? (
                        <img src={item.image_url.startsWith('http') || item.image_url.startsWith('blob:') ? item.image_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${item.image_url}`} className="w-full h-full object-cover" />
                       ) : (
                         <ImageIcon size={16} className={themeMode === 'dark' ? 'text-slate-600' : 'text-slate-300'} />
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm truncate ${themeMode === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{item.name}</h4>
                      {item.description && <p className={`text-[10px] mt-0.5 line-clamp-2 leading-tight ${themeMode === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{item.description}</p>}
                      <div className="font-extrabold mt-1.5" style={{ color: primaryColor }}>
                        {item.portions && item.portions.length > 0 
                          ? `From ${currency?.trim()} ${Math.min(...item.portions.map(p => parseFloat(p.price))).toFixed(2)}`
                          : `${currency?.trim()} ${parseFloat(item.price || 0).toFixed(2)}`
                        }
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-xs text-slate-400 py-4 font-medium">Add items in Menu Management to see them here.</div>
                )}
              </div>
            </div>

            <div className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t pt-8 z-20 ${themeMode === 'dark' ? 'from-slate-950 via-slate-950 to-transparent' : 'from-white via-white to-transparent'}`}>
              <div className="w-full py-3.5 rounded-xl text-center text-white font-bold text-sm shadow-lg" style={{ backgroundColor: secondaryColor }}>
                View Order
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
