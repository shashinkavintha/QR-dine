"use client";

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import toast from 'react-hot-toast';
import { 
  User, Building, ShieldCheck, CreditCard, 
  Loader2, Save, Upload, MapPin, Mail, Phone, Lock, Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  
  // Form States
  const [accountData, setAccountData] = useState({ first_name: '', last_name: '', phone: '', email: '' });
  const [hotelData, setHotelData] = useState({ restaurant_name: '', address: '', currency: 'LKR', timezone: 'Asia/Colombo' });
  const [securityData, setSecurityData] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  
  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  
  // Files
  const [avatarFile, setAvatarFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  
  // Previews
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/user/profile');
      const data = await res.json();
      
      setProfile(data);
      setAccountData({
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || '',
        phone: data.user.phone || '',
        email: data.user.email || ''
      });
      setHotelData({
        restaurant_name: data.hotel.restaurant_name || '',
        address: data.hotel.address || '',
        currency: data.hotel.currency || 'LKR',
        timezone: data.hotel.timezone || 'Asia/Colombo'
      });
      setAvatarPreview(data.user.avatar_url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${data.user.avatar_url}` : null);
      setLogoPreview(data.hotel.logo_url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${data.hotel.logo_url}` : null);
    } catch (error) {
      toast.error('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('first_name', accountData.first_name);
      formData.append('last_name', accountData.last_name);
      formData.append('phone', accountData.phone);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await fetchWithAuth('/api/user/profile/personal', {
        method: 'POST',
        body: formData,
        isFormData: true
      });

      if (!res.ok) throw new Error('Failed to update account.');
      toast.success('Account settings saved successfully!');
    } catch (error) {
      toast.error(error.message || 'Error saving account settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleHotelSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('restaurant_name', hotelData.restaurant_name);
      formData.append('address', hotelData.address);
      formData.append('currency', hotelData.currency);
      formData.append('timezone', hotelData.timezone);
      if (logoFile) formData.append('logo', logoFile);

      const res = await fetchWithAuth('/api/user/profile/hotel', {
        method: 'POST',
        body: formData,
        isFormData: true
      });

      if (!res.ok) throw new Error('Failed to update hotel details.');
      toast.success('Hotel details saved successfully!');
    } catch (error) {
      toast.error(error.message || 'Error saving hotel details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (securityData.new_password !== securityData.new_password_confirmation) {
      return toast.error('Passwords do not match.');
    }
    setSaving(true);
    try {
      const res = await fetchWithAuth('/api/user/profile/security/otp', {
        method: 'POST',
        body: JSON.stringify(securityData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request OTP.');
      toast.success('OTP sent to your email!');
      setShowOtpModal(true);
    } catch (error) {
      toast.error(error.message || 'Error requesting OTP.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpVerifying(true);
    try {
      const res = await fetchWithAuth('/api/user/profile/security/verify', {
        method: 'POST',
        body: JSON.stringify({
          otp: otpCode,
          new_password: securityData.new_password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid OTP.');
      toast.success('Password updated successfully! Please log in again.');
      
      // Clear OTP Modal
      setShowOtpModal(false);
      setOtpCode('');
      
      // Log out and delay redirect so user can read the success message
      localStorage.removeItem('tenant_token');
      document.cookie = 'tenant_token=; path=/; max-age=0; SameSite=Lax';
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2500);
    } catch (error) {
      toast.error(error.message || 'Error verifying OTP.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm("Are you sure? This action cannot be undone. All your menus, orders, and data will be permanently deleted.");
    if (!isConfirmed) return;

    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/user/profile/delete-account', {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete account.');
      
      toast.success('Account permanently deleted.');
      // Clear token and redirect to home
      localStorage.removeItem('tenant_token');
      document.cookie = 'tenant_token=; path=/; max-age=0; SameSite=Lax';
      router.push('/');
    } catch (error) {
      toast.error(error.message || 'Error deleting account.');
      setLoading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-orange-500" size={40} />
          <p className="text-slate-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  const isGoogleUser = profile?.user?.auth_provider === 'google';
  const isStaff = profile?.user?.role === 'staff';

  return (
    <div className="p-6 lg:p-8 max-w-6xl w-full pb-24">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Profile Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your account preferences and hotel details.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        
        {/* Sidebar */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-1">
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'account' 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <User size={18} className={activeTab === 'account' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'} />
            Personal Info
          </button>
          
          <button 
            onClick={() => setActiveTab('hotel')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'hotel' 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Building size={18} className={activeTab === 'hotel' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'} />
            Hotel Details
          </button>
          
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'security' 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <ShieldCheck size={18} className={activeTab === 'security' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'} />
            Security
          </button>
          
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  <CreditCard size={16} className="text-slate-400" />
                  Subscription
                </h4>
                <div className="flex items-center gap-2 mb-4 mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                    {profile?.user?.plan_status === 'active' ? 'Active Pro Plan' : 'Trialing Plan'}
                  </p>
                </div>
                <button 
                  onClick={() => router.push('/dashboard/billing')}
                  className="w-full py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  Manage Billing
                </button>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            {/* Account Tab */}
            {activeTab === 'account' && (
              <form onSubmit={handleAccountSubmit}>
                <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Personal Information</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Update your personal details and public profile.</p>
                </div>
                
                <div className="p-6 sm:p-8 space-y-8">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={32} className="text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1">Profile Picture</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">JPG, GIF or PNG. Max size of 2MB.</p>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        Upload New
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">First Name</label>
                      <input 
                        type="text" 
                        value={accountData.first_name} 
                        onChange={e => setAccountData({...accountData, first_name: e.target.value})}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last Name</label>
                      <input 
                        type="text" 
                        value={accountData.last_name} 
                        onChange={e => setAccountData({...accountData, last_name: e.target.value})}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
                        placeholder="Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        value={accountData.email} 
                        disabled
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed text-sm shadow-sm"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">Email cannot be changed for billing reasons.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                      <input 
                        type="text" 
                        value={accountData.phone} 
                        onChange={e => setAccountData({...accountData, phone: e.target.value})}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
                        placeholder="+94 77 123 4567"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/30 flex justify-end border-t border-slate-200 dark:border-slate-800">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-white transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:bg-slate-900"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Hotel Tab */}
            {activeTab === 'hotel' && (
              <form onSubmit={handleHotelSubmit}>
                <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Hotel Details</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Update your restaurant information and branding.</p>
                </div>
                
                <div className="p-6 sm:p-8 space-y-8">
                  {/* Logo Upload */}
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1.5" />
                      ) : (
                        <Building size={32} className="text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1">Hotel Logo</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 max-w-sm">This logo appears at the top of your digital menu.</p>
                      {!isStaff && (
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors shadow-sm">
                          Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Hotel / Restaurant Name</label>
                      <input 
                        type="text" 
                        disabled={isStaff}
                        value={hotelData.restaurant_name} 
                        onChange={e => setHotelData({...hotelData, restaurant_name: e.target.value})}
                        className={`w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-slate-900 dark:text-slate-100 shadow-sm ${isStaff ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-70' : 'bg-white dark:bg-slate-900'}`}
                        placeholder="Grand Hotel"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                      <textarea 
                        rows={3}
                        disabled={isStaff}
                        value={hotelData.address} 
                        onChange={e => setHotelData({...hotelData, address: e.target.value})}
                        className={`w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-slate-900 dark:text-slate-100 shadow-sm resize-none ${isStaff ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-70' : 'bg-white dark:bg-slate-900'}`}
                        placeholder="123 Main Street, City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
                      <div className="relative">
                        <select 
                          disabled={isStaff}
                          value={hotelData.currency} 
                          onChange={e => setHotelData({...hotelData, currency: e.target.value})}
                          className={`w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-slate-900 dark:text-slate-100 shadow-sm appearance-none ${isStaff ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-70' : 'bg-white dark:bg-slate-900'}`}
                        >
                          <option value="LKR">LKR (Sri Lankan Rupee)</option>
                          <option value="USD">USD (US Dollar)</option>
                          <option value="EUR">EUR (Euro)</option>
                          <option value="GBP">GBP (British Pound)</option>
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Timezone</label>
                      <div className="relative">
                        <select 
                          disabled={isStaff}
                          value={hotelData.timezone} 
                          onChange={e => setHotelData({...hotelData, timezone: e.target.value})}
                          className={`w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-slate-900 dark:text-slate-100 shadow-sm appearance-none ${isStaff ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-70' : 'bg-white dark:bg-slate-900'}`}
                        >
                          <option value="Asia/Colombo">Asia/Colombo (Sri Lanka)</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">America/New_York</option>
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {isStaff ? (
                  <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
                    Hotel details are managed by the owner and cannot be edited by staff members.
                  </div>
                ) : (
                  <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/30 flex justify-end border-t border-slate-200 dark:border-slate-800">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-white transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:bg-slate-900"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Security Settings</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your password and account security.</p>
                </div>
                
                <div className="p-6 sm:p-8">
                  
                  {isGoogleUser ? (
                    <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-2xl shadow-sm">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500"></div>
                      <div className="flex items-start sm:items-center gap-6 flex-col sm:flex-row">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                          {/* Google SVG Icon */}
                          <svg className="w-8 h-8" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Managed by Google</h4>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                            Your account is securely connected via Google Authentication. You do not need a password to log in. Please continue using the "Sign in with Google" button.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSecuritySubmit} className="max-w-xl">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                          <Lock className="text-orange-500" size={20} />
                          Change Password
                        </h4>
                        
                        <div className="space-y-5">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
                            <input 
                              type="password" 
                              required
                              value={securityData.current_password} 
                              onChange={e => setSecurityData({...securityData, current_password: e.target.value})}
                              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
                              placeholder="Enter current password"
                            />
                          </div>
                          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                            <input 
                              type="password" 
                              required
                              value={securityData.new_password} 
                              onChange={e => setSecurityData({...securityData, new_password: e.target.value})}
                              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
                              placeholder="Enter new password (min. 8 characters)"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                            <input 
                              type="password" 
                              required
                              value={securityData.new_password_confirmation} 
                              onChange={e => setSecurityData({...securityData, new_password_confirmation: e.target.value})}
                              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
                              placeholder="Re-enter new password"
                            />
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                          <button 
                            type="submit" 
                            disabled={saving}
                            className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-white transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:bg-slate-900 w-full sm:w-auto justify-center"
                          >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                            Update Password
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Danger Zone */}
                  {!isStaff && (
                    <div className="mt-12 max-w-xl">
                      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-3xl p-8 shadow-sm">
                        <h4 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2">Danger Zone</h4>
                        <p className="text-red-600 dark:text-red-300 text-sm mb-6">
                          Deleting your account is permanent. All your menus, orders, QR codes, and settings will be instantly wiped out. Active subscriptions will be canceled.
                        </p>
                        
                        <button 
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
                        >
                          Delete Account / Cancel Subscription
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Security Verification</h3>
            <p className="text-slate-500 text-sm mb-6">Enter the 6-digit verification code sent to your email address.</p>
            
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="------"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpVerifying || otpCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {otpVerifying ? <Loader2 className="animate-spin w-4 h-4" /> : 'Verify & Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
