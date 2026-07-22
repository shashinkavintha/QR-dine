"use client";

import { useState, useEffect } from 'react';
import { CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  
  const [checkoutData, setCheckoutData] = useState(null);
  const [systemSettings, setSystemSettings] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('payhere'); // 'payhere' | 'bank_transfer'
  const [bankSlip, setBankSlip] = useState(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Read checkout data from session storage
    const storedData = sessionStorage.getItem('checkoutData');
    if (storedData) {
      setCheckoutData(JSON.parse(storedData));
    } else {
      // If no data, go back to billing
      router.push('/dashboard/billing');
    }

    // Fetch system settings for bank transfer details
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/system-settings/public`)
      .then(res => res.json())
      .then(data => {
        setSystemSettings(data);
        if (data.enable_payhere !== 'true') {
          setPaymentMethod('bank_transfer');
        }
      })
      .catch(console.error);
  }, [router]);

  const confirmPayment = () => {
    if (!checkoutData) return;
    
    if (typeof window.payhere !== 'undefined') {
        window.payhere.onCompleted = async function onCompleted(orderId) {
            try {
              // FOR LOCAL DEVELOPMENT ONLY: Simulate the webhook call since localhost can't receive it
              if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/billing/payhere/simulate-webhook`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ order_id: orderId })
                  });
              }
            } catch(e) {
              console.error("Local webhook simulation failed", e);
            }
            
            sessionStorage.removeItem('checkoutData');
            router.push('/dashboard/billing?status=success');
        };
        window.payhere.onDismissed = function onDismissed() {
            // Do nothing, just stay on page
        };
        window.payhere.onError = function onError(error) {
            toast.error('Payment error: ' + error);
        };

        const paymentObj = {
            sandbox: checkoutData.env === 'sandbox',
            merchant_id: checkoutData.merchant_id,
            return_url: window.location.origin + '/dashboard/billing?status=success',
            cancel_url: window.location.origin + '/dashboard/billing?status=cancel',
            notify_url: checkoutData.notify_url,
            order_id: checkoutData.orderId,
            items: 'Subscription Plan',
            amount: checkoutData.formatted_amount,
            currency: 'LKR',
            hash: checkoutData.hash,
            first_name: 'Hotel',
            last_name: 'Admin',
            email: 'admin@example.com',
            phone: '0771234567',
            address: 'No. 1, Galle Road',
            city: 'Colombo',
            country: 'Sri Lanka'
        };
        window.payhere.startPayment(paymentObj);
    } else {
        toast.error('PayHere SDK not loaded. Please refresh the page.');
    }
  };

  const handleBankTransfer = async () => {
    if (!bankSlip) {
      toast.error("Please upload a bank slip image");
      return;
    }
    
    setUploadingSlip(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('plan_id', checkoutData.plan_id);
    formData.append('slip', bankSlip);
    
    try {
      const token = localStorage.getItem('tenant_token');
      if (!token) throw new Error('Not authenticated');

      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/tenant/subscriptions/bank-transfer`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
          } catch (e) {
            reject(new Error('Invalid response'));
          }
        };

        xhr.onerror = () => reject(new Error('Network Error'));
        xhr.send(formData);
      });

      if (response.ok && response.data.success) {
        sessionStorage.removeItem('checkoutData');
        router.push('/dashboard/billing?status=pending');
      } else {
        toast.error(response.data.message || 'Failed to upload slip.');
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred');
    } finally {
      setUploadingSlip(false);
    }
  };

  if (!checkoutData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full pb-24 space-y-8">
      <button 
        onClick={() => router.push('/dashboard/billing')}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to Billing
      </button>

      <div className="bg-white dark:bg-slate-900 p-8 lg:p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-8">Confirm Subscription</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: Summary */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Order Summary</h3>
            <div className="space-y-4 mb-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="font-medium">Selected Plan Price</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Rs. {Number(checkoutData.original_price).toFixed(2)}</span>
              </div>
              
              {checkoutData.discount > 0 && (
                <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                  <span className="font-medium">Unused Plan Discount</span>
                  <span className="font-semibold">- Rs. {Number(checkoutData.discount).toFixed(2)}</span>
                </div>
              )}
              
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">Final Payable</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">Rs. {Number(checkoutData.formatted_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Method */}
          <div>
            {(systemSettings.enable_payhere === 'true' || systemSettings.enable_bank_transfer == 1 || systemSettings.bank_name) && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Payment Method</h3>
                <div className={`grid ${systemSettings.enable_payhere === 'true' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                  {systemSettings.enable_payhere === 'true' && (
                    <button
                      onClick={() => setPaymentMethod('payhere')}
                      className={`py-4 px-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${
                        paymentMethod === 'payhere' 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 ring-2 ring-orange-500/20' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <CreditCard size={24} />
                      Pay Online
                    </button>
                  )}
                  <button
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`py-4 px-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'bank_transfer' 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 ring-2 ring-orange-500/20' 
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    Bank Transfer
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <div className="mb-8 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-sm">Bank Details</h4>
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 mb-6">
                  <div className="flex justify-between items-center"><span className="font-medium text-slate-500">Bank</span> <span className="font-semibold text-slate-900 dark:text-slate-100">{systemSettings.bank_name || 'N/A'}</span></div>
                  <div className="flex justify-between items-center"><span className="font-medium text-slate-500">Account Name</span> <span className="font-semibold text-slate-900 dark:text-slate-100">{systemSettings.bank_account_name || 'N/A'}</span></div>
                  <div className="flex justify-between items-center"><span className="font-medium text-slate-500">Account No</span> <span className="font-semibold text-slate-900 dark:text-slate-100">{systemSettings.bank_account_number || 'N/A'}</span></div>
                  <div className="flex justify-between items-center"><span className="font-medium text-slate-500">Branch</span> <span className="font-semibold text-slate-900 dark:text-slate-100">{systemSettings.bank_branch || 'N/A'}</span></div>
                </div>
                
                <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Upload Payment Slip</label>
                  <input 
                    type="file" 
                    accept="image/*,.pdf"
                    onChange={(e) => setBankSlip(e.target.files[0])}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-500/10 dark:file:text-orange-400 dark:hover:file:bg-orange-500/20 transition-colors cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-3">Max size: 5MB. Formats: JPG, PNG, PDF</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              {paymentMethod === 'payhere' ? (
                <button
                  onClick={confirmPayment}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Proceed to Secure Payment
                </button>
              ) : (
                <button
                  onClick={handleBankTransfer}
                  disabled={!bankSlip || uploadingSlip}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {uploadingSlip ? (
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <Loader2 className="animate-spin" size={18} />
                      {uploadProgress === 100 ? 'Processing...' : `${uploadProgress}% Uploading`}
                    </span>
                  ) : (
                    'Submit Slip'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
