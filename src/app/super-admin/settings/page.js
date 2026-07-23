"use client";

import { useState, useEffect } from 'react';
import { Key, Mail, Lock, CreditCard } from 'lucide-react';
import { fetchWithSuperAdminAuth } from '@/utils/api';
import dynamic from 'next/dynamic';

const ImageAdjusterModal = dynamic(() => import('@/components/ImageAdjusterModal'), { ssr: false });

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    payhere_merchant_id: '',
    payhere_secret: '',
    payhere_env: 'sandbox',
    smtp_host: '',
    smtp_port: '',
    smtp_encryption: '',
    smtp_username: '',
    smtp_password: '',
    enable_payhere: 'false',
  });
  const [loading, setLoading] = useState(true);
  const [savingPayhere, setSavingPayhere] = useState(false);
  const [savingTestimonials, setSavingTestimonials] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  
  // Image adjuster state
  const [adjuster, setAdjuster] = useState(null); // { deviceType, imageSrc }
  const [pendingImages, setPendingImages] = useState({ phone: null, tablet: null, laptop: null, hero_bg: null });
  const [savingImages, setSavingImages] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetchWithSuperAdminAuth('/api/super-admin/settings');
      const data = await res.json();
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
        if (data.landing_page_testimonials) {
          try {
            setTestimonials(JSON.parse(data.landing_page_testimonials));
          } catch(e) { console.error(e); }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const [savingBankDetails, setSavingBankDetails] = useState(false);

  const handleSavePayhere = async () => {
    setSavingPayhere(true);
    try {
      const res = await fetchWithSuperAdminAuth('/api/super-admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          payhere_merchant_id: settings.payhere_merchant_id,
          payhere_secret: settings.payhere_secret,
          payhere_env: settings.payhere_env,
          enable_payhere: settings.enable_payhere,
        })
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('PayHere settings saved.');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setSavingPayhere(false);
    }
  };

  const handleSaveBankDetails = async () => {
    setSavingBankDetails(true);
    try {
      const res = await fetchWithSuperAdminAuth('/api/super-admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          bank_name: settings.bank_name,
          bank_account_name: settings.bank_account_name,
          bank_account_number: settings.bank_account_number,
          bank_branch: settings.bank_branch,
        })
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('Bank Details saved.');
    } catch (error) {
      console.error('Error saving bank details:', error);
      alert('Failed to save bank details.');
    } finally {
      setSavingBankDetails(false);
    }
  };


  const handleSaveTestimonials = async () => {
    setSavingTestimonials(true);
    try {
      const res = await fetchWithSuperAdminAuth('/api/super-admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          landing_page_testimonials: JSON.stringify(testimonials)
        })
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('Testimonials saved successfully.');
    } catch (error) {
      console.error('Error saving testimonials:', error);
      alert('Failed to save testimonials.');
    } finally {
      setSavingTestimonials(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-medium text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">System Settings</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">Manage global configurations, payment gateways, and email servers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payment Gateway Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Payment Gateway</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Enable Online Payments</h4>
                <p className="text-xs text-slate-500 mt-0.5">Allow users to pay via PayHere</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.enable_payhere === 'true'}
                  onChange={(e) => setSettings({...settings, enable_payhere: e.target.checked ? 'true' : 'false'})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">PayHere Merchant ID</label>
              <input 
                type="text" 
                value={settings.payhere_merchant_id || ''}
                onChange={(e) => setSettings({...settings, payhere_merchant_id: e.target.value})}
                placeholder="1234567" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-orange-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">PayHere Secret (App Secret / Merchant Secret)</label>
              <input 
                type="password" 
                value={settings.payhere_secret || ''}
                onChange={(e) => setSettings({...settings, payhere_secret: e.target.value})}
                placeholder="********" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-orange-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Environment</label>
              <select
                value={settings.payhere_env || 'sandbox'}
                onChange={(e) => setSettings({...settings, payhere_env: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-orange-500"
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="production">Production</option>
              </select>
            </div>
            <button 
              onClick={handleSavePayhere}
              disabled={savingPayhere}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 mt-2"
            >
              {savingPayhere ? 'Saving...' : 'Save Keys'}
            </button>
          </div>
        </div>

        {/* Bank Transfer Details Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CreditCard className="text-slate-400" size={20} />
            Bank Transfer Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Bank Name</label>
              <input 
                type="text" 
                value={settings.bank_name || ''}
                onChange={(e) => setSettings({...settings, bank_name: e.target.value})}
                placeholder="e.g. Commercial Bank" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-orange-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Account Name</label>
              <input 
                type="text" 
                value={settings.bank_account_name || ''}
                onChange={(e) => setSettings({...settings, bank_account_name: e.target.value})}
                placeholder="e.g. QR Dine Solutions" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-orange-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Account Number</label>
              <input 
                type="text" 
                value={settings.bank_account_number || ''}
                onChange={(e) => setSettings({...settings, bank_account_number: e.target.value})}
                placeholder="e.g. 1000 2345 6789" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-orange-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Branch Name</label>
              <input 
                type="text" 
                value={settings.bank_branch || ''}
                onChange={(e) => setSettings({...settings, bank_branch: e.target.value})}
                placeholder="e.g. Colombo 03" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-orange-500" 
              />
            </div>
            <button 
              onClick={handleSaveBankDetails}
              disabled={savingBankDetails}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 mt-2"
            >
              {savingBankDetails ? 'Saving...' : 'Save Bank Details'}
            </button>
          </div>
        </div>
        
        {/* Landing Page Customization */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Landing Page Mockup Images</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium -mt-2">Upload an image, then click <strong>Adjust &amp; Preview</strong> to reposition and crop it to fit perfectly inside each device mockup.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { key: 'phone', label: 'Phone', urlKey: 'hero_mockup_image_phone_url' },
              { key: 'tablet', label: 'Tablet', urlKey: 'hero_mockup_image_tablet_url' },
              { key: 'laptop', label: 'Laptop', urlKey: 'hero_mockup_image_laptop_url' },
              { key: 'hero_bg', label: 'Hero Background', urlKey: 'hero_bg_image' },
            ].map(({ key, label, urlKey }) => {
              const pending = pendingImages[key];
              const savedUrl = settings[urlKey];
              const displaySrc = pending
                ? URL.createObjectURL(pending)
                : savedUrl
                ? (savedUrl.startsWith('http') ? savedUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${savedUrl}`)
                : null;

              return (
                <div key={key} className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <p className="text-sm font-bold text-slate-700">{label} Mockup</p>

                  {/* Preview thumbnail */}
                  <div className="w-full aspect-[3/2] rounded-xl bg-slate-200 overflow-hidden border border-slate-200 flex items-center justify-center">
                    {displaySrc ? (
                      <img src={displaySrc} alt={`${label} preview`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">No image</span>
                    )}
                  </div>

                  {/* File input */}
                  <label className="block w-full cursor-pointer">
                    <span className="w-full flex items-center justify-center text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg py-2 transition-colors">
                      Choose Image
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (key === 'hero_bg') {
                          // No adjuster for hero bg, just store directly
                          setPendingImages(prev => ({ ...prev, [key]: file }));
                        } else {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setAdjuster({ deviceType: key, imageSrc: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {/* Adjust button shown when there's a pending or saved image, EXCEPT for hero_bg */}
                  {displaySrc && key !== 'hero_bg' && (
                    <button
                      onClick={async () => {
                        // blob:/data: → local, use directly (no CORS issue)
                        if (displaySrc.startsWith('blob:') || displaySrc.startsWith('data:')) {
                          setAdjuster({ deviceType: key, imageSrc: displaySrc });
                          return;
                        }
                        // Remote saved image → fetch via CORS-friendly proxy and convert to data URL
                        try {
                          // Extract the path after /storage/ from the URL
                          // e.g. http://127.0.0.1:8000/storage/settings/abc.jpg → settings/abc.jpg
                          const urlObj = new URL(displaySrc);
                          const storagePath = urlObj.pathname.replace('/storage/', '');
                          const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/storage-proxy/${storagePath}`;
                          const resp = await fetch(proxyUrl);
                          if (!resp.ok) throw new Error('Proxy fetch failed');
                          const blob = await resp.blob();
                          const dataUrl = await new Promise((res) => {
                            const reader = new FileReader();
                            reader.onload = () => res(reader.result);
                            reader.readAsDataURL(blob);
                          });
                          setAdjuster({ deviceType: key, imageSrc: dataUrl });
                        } catch (e) {
                          console.error('Could not load image for editing:', e);
                          alert('Could not load image for editing. Please upload a new image.');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg py-2 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Adjust &amp; Preview
                    </button>
                  )}

                  {/* Status badge */}
                  {pending && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Ready to upload
                    </div>
                  )}
                  {!pending && savedUrl && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Live on landing page
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upload all pending button */}
          {(pendingImages.phone || pendingImages.tablet || pendingImages.laptop || pendingImages.hero_bg) && (
            <div className="pt-2">
              <button
                onClick={async () => {
                  setSavingImages(true);
                  try {
                    const formData = new FormData();
                    if (pendingImages.phone) formData.append('hero_mockup_image_phone', pendingImages.phone);
                    if (pendingImages.tablet) formData.append('hero_mockup_image_tablet', pendingImages.tablet);
                    if (pendingImages.laptop) formData.append('hero_mockup_image_laptop', pendingImages.laptop);
                    if (pendingImages.hero_bg) formData.append('hero_bg_image', pendingImages.hero_bg);

                    const res = await fetchWithSuperAdminAuth('/api/super-admin/settings', {
                      method: 'POST',
                      body: formData
                    });

                    if (!res.ok) throw new Error('Failed to upload');
                    setPendingImages({ phone: null, tablet: null, laptop: null, hero_bg: null });
                    alert('Images uploaded successfully!');
                    fetchSettings();
                  } catch (error) {
                    console.error(error);
                    alert('Error uploading images');
                  } finally {
                    setSavingImages(false);
                  }
                }}
                disabled={savingImages}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                {savingImages ? 'Uploading...' : '↑ Upload All Pending Images'}
              </button>
            </div>
          )}
        </div>

        {/* Testimonials Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Testimonials</h3>
          </div>
          
          <div className="space-y-4">
            {testimonials.map((testi, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input 
                  type="text" 
                  value={testi.author || ''}
                  onChange={(e) => {
                    const newT = [...testimonials];
                    newT[index].author = e.target.value;
                    setTestimonials(newT);
                  }}
                  placeholder="Author (e.g. John D.)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 outline-none"
                />
                <input 
                  type="text" 
                  value={testi.role || ''}
                  onChange={(e) => {
                    const newT = [...testimonials];
                    newT[index].role = e.target.value;
                    setTestimonials(newT);
                  }}
                  placeholder="Role (e.g. Manager)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 outline-none"
                />
                <input 
                  type="text" 
                  value={testi.text || ''}
                  onChange={(e) => {
                    const newT = [...testimonials];
                    newT[index].text = e.target.value;
                    setTestimonials(newT);
                  }}
                  placeholder="Testimonial text..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 outline-none md:col-span-2"
                />
                <button 
                  onClick={() => {
                    const newT = [...testimonials];
                    newT.splice(index, 1);
                    setTestimonials(newT);
                  }}
                  className="text-red-500 font-bold text-sm bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 col-span-1 md:col-span-4"
                >
                  Remove
                </button>
              </div>
            ))}

            <button 
              onClick={() => {
                setTestimonials([...testimonials, { text: '', author: '', role: '' }]);
              }}
              className="text-slate-600 font-bold text-sm bg-slate-100 px-4 py-2 rounded-lg hover:bg-slate-200"
            >
              + Add Testimonial
            </button>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleSaveTestimonials}
              disabled={savingTestimonials}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {savingTestimonials ? 'Saving...' : 'Save Testimonials'}
            </button>
          </div>
        </div>

      </div>

      {/* Image Adjuster Modal */}
      {adjuster && (
        <ImageAdjusterModal
          deviceType={adjuster.deviceType}
          imageSrc={adjuster.imageSrc}
          onClose={() => setAdjuster(null)}
          onSave={async (croppedFile) => {
            // Store cropped file as pending – user still needs to click Upload
            setPendingImages(prev => ({ ...prev, [adjuster.deviceType]: croppedFile }));
          }}
        />
      )}

    </div>
  );
}
