"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, UtensilsCrossed, QrCode, Upload, ArrowRight, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 Data
  const [primaryColor, setPrimaryColor] = useState('#f97316');
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  const [logo, setLogo] = useState(null);
  const fileInputRef = useRef(null);

  const handleLogoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  // Step 2 Data
  const [categoryName, setCategoryName] = useState('Starters');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  const nextStep = () => setStep(s => Math.min(2, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleFinish = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('tenant_token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const formData = new FormData();
      formData.append('restaurant_name', restaurantName);
      formData.append('primary_color', primaryColor);
      formData.append('category_name', categoryName);
      formData.append('item_name', itemName);
      formData.append('item_price', itemPrice);
      if (logo) {
        formData.append('logo', logo);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/tenant/onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert(data.message || 'Failed to save onboarding details.');
      }
    } catch (error) {
      console.error(error);
      alert(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-orange-500 selection:text-white">
      
      {/* Top Progress Bar */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-rose-500 rounded-lg flex items-center justify-center text-white text-sm shadow-md">M</div>
             QR Dine Setup
          </div>
          
          <div className="flex items-center gap-2">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= i ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {i}
                </div>
                {i < 2 && <div className={`w-8 h-1 mx-1 rounded-full transition-colors ${step > i ? 'bg-orange-500' : 'bg-slate-100'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: BRANDING */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full"
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Palette size={32} />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Let's customize your menu</h1>
                <p className="text-slate-500 font-medium text-lg">Set up your brand identity so customers recognize you.</p>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-6">


                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Upload Logo</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-orange-400 cursor-pointer transition-colors"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/png, image/jpeg"
                      onChange={handleLogoUpload}
                    />
                    {logo ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle2 size={32} className="mb-3 text-green-500" />
                        <span className="font-bold text-slate-700">{logo.name}</span>
                        <span className="text-xs font-medium mt-1 text-slate-400">Click to change</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={32} className="mb-3 text-slate-400" />
                        <span className="font-bold">Click to upload or drag & drop</span>
                        <span className="text-xs font-medium mt-1 text-slate-400">PNG, JPG up to 2MB</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Brand Color</label>
                  <div className="flex items-center gap-4">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-12 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer" />
                    <div className="flex gap-2">
                      {['#f97316', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#1e293b'].map(color => (
                        <button key={color} onClick={() => setPrimaryColor(color)} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={nextStep} className="bg-slate-900 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                  Next Step <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}


          {/* STEP 2: QR CODE */}
          {step === 2 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full"
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCode size={32} />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">You're all set! 🎉</h1>
                <p className="text-slate-500 font-medium text-lg">Here is your unique QR code. Print it and place it on tables.</p>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-6">
                  <QRCode 
                    value="https://qrmenu.com/menu/new-restaurant" 
                    size={200}
                    fgColor={primaryColor}
                    bgColor="transparent"
                  />
                </div>

                <p className="text-sm text-slate-500 mt-1 mb-6">Scan to view the menu</p>
                
                <p className="text-xs text-slate-400 max-w-sm text-center mb-2">
                  Don't worry, you can always download this later from your dashboard.
                </p>
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={prevStep} className="text-slate-500 font-bold px-6 py-4 hover:bg-slate-100 rounded-xl transition-colors">
                  Back
                </button>
                <button disabled={loading} onClick={handleFinish} className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 shadow-[0_0_40px_-10px_rgba(249,115,22,0.6)] hover:shadow-[0_0_60px_-15px_rgba(249,115,22,0.8)] hover:scale-105 transition-all duration-300">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <>Go to Dashboard <ArrowRight size={20} /></>}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
