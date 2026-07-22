"use client";

import { useState, useEffect, Suspense } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2, Zap, Clock } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function BillingContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const router = useRouter();

  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [billingStatus, setBillingStatus] = useState(null);
  
  useEffect(() => {
    // Fetch plans
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/plans`)
      .then(res => res.json())
      .then(data => {
        setPlans(data);
      })
      .catch(console.error);

    // Fetch billing status
    fetchWithAuth('/api/billing/status')
      .then(res => res.json())
      .then(data => setBillingStatus(data))
      .catch(console.error);
  }, []);

  const subscribe = async (planId, amount) => {
    if (!planId) return;
    setLoadingPlanId(planId);
    try {
      const orderId = `SUB_${billingStatus?.tenant_id || Math.floor(Math.random() * 10000)}_${planId}_${Date.now()}`;
      const res = await fetchWithAuth('/api/billing/payhere/hash', {
        method: 'POST',
        body: JSON.stringify({ 
          order_id: orderId,
          amount: amount,
          currency: 'LKR'
        })
      });
      const data = await res.json();

      if (res.ok) {
        // Store checkout data and navigate to checkout page
        sessionStorage.setItem('checkoutData', JSON.stringify({ ...data, orderId, plan_id: planId }));
        router.push('/dashboard/billing/checkout');
      } else {
        toast.error(data.error || 'Failed to initialize payment.');
        setLoadingPlanId(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred');
      setLoadingPlanId(null);
    }
  };
  const isExpired = billingStatus?.type === 'expired';
  const isTrial = billingStatus?.type === 'trial';
  const isPaid = billingStatus?.type === 'paid';
  const currentExpiry = billingStatus?.expire_date ? new Date(billingStatus.expire_date) : null;
  const planName = billingStatus?.plan_name || 'Basic Package';
  const isPending = billingStatus?.transaction_status === 'pending';
  const isRejected = billingStatus?.transaction_status === 'rejected';

  return (
    <div className="p-6 lg:p-8 max-w-6xl w-full pb-24 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Billing & Subscription</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your active plan, view your usage, and update payment methods.</p>
      </div>

      {status === 'success' && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="text-emerald-500" size={20} />
          <span className="font-medium">Payment completed successfully! Your subscription has been updated.</span>
        </div>
      )}
      {(status === 'cancel' && !isPending && !isRejected) && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="text-red-500" size={20} />
          <span className="font-medium">Payment was canceled.</span>
        </div>
      )}
      {((status === 'pending' && !isRejected && !isPaid) || isPending) && (
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <Clock className="text-blue-500" size={20} />
          <span className="font-medium">Your bank transfer is pending approval. We will notify you once it's verified.</span>
        </div>
      )}
      {isRejected && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="text-red-500" size={20} />
          <span className="font-medium">Your recent bank transfer was rejected. Please try again or use another payment method.</span>
        </div>
      )}

      {/* Current Plan Overview */}
      {!billingStatus ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 flex justify-center items-center min-h-[160px]">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 font-semibold text-xs rounded-full mb-4 tracking-wide uppercase ${
              isExpired 
                ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' 
                : (isTrial 
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' 
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400')
            }`}>
              <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500' : isTrial ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
              {isExpired ? 'Expired' : (isTrial ? 'Trial Active' : 'Active Subscription')}
            </div>

            {/* Plan Name */}
            {isPaid && (
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {planName} Plan
              </h3>
            )}

            {/* Description */}
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base max-w-md">
              {isExpired 
                ? 'Your plan has expired. Please upgrade below to continue using our services.'
                : isTrial
                  ? `You are currently enjoying the 14-day free trial. Upgrade anytime.`
                  : `You are currently on the ${planName} plan.`}
            </p>
          </div>
          <div className="shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50">
             <div className="text-sm font-medium text-slate-500 dark:text-slate-400 text-left md:text-right mb-1">
               {isExpired ? 'Expired on' : isTrial ? 'Trial ends on' : 'Next billing date'}
             </div>
             <div className={`text-lg font-bold ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
               {currentExpiry ? currentExpiry.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} 
             </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="pt-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Upgrade your plan</h3>
        
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map(plan => {
            const isCurrentPlan = billingStatus?.type === 'paid' && billingStatus?.plan_name === plan.name;
            const isDowngrade = billingStatus?.type === 'paid' && parseFloat(plan.price) < parseFloat(billingStatus?.plan_price || 0);
            const features = Array.isArray(plan.features) 
              ? plan.features 
              : (typeof plan.features === 'string' ? JSON.parse(plan.features) : []);
            const isPopular = plan.slug === 'pro';

            return (
              <div 
                key={plan.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl relative flex flex-col p-8 transition-all duration-200
                  ${isCurrentPlan 
                    ? 'border-2 border-emerald-500 shadow-md bg-emerald-50/10 dark:bg-emerald-900/10' 
                    : (isPopular 
                        ? 'border-2 border-orange-500 shadow-lg transform md:-translate-y-2' 
                        : 'border border-slate-200 dark:border-slate-700 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md')}`}
              >
                {isPopular && !isCurrentPlan && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-emerald-200 dark:border-emerald-700">
                    Current Plan
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">{plan.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">Rs. {parseInt(plan.price).toLocaleString()}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">/ {plan.duration_months === 1 ? 'mo' : plan.duration_months + ' mo'}</span>
                  </div>
                </div>

                <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800 mb-6"></div>

                <ul className="space-y-4 mb-8 flex-1">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                      <span className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-4">
                  <button 
                    onClick={() => subscribe(plan.id, plan.price)}
                    disabled={isCurrentPlan || isDowngrade || isPending || loadingPlanId !== null}
                    className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm
                      ${(isCurrentPlan || isDowngrade || isPending)
                        ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent' 
                        : (isPopular 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm' 
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm')
                      }`}
                  >
                    {loadingPlanId === plan.id ? <Loader2 className="animate-spin" size={16} /> : (isCurrentPlan ? 'Current Plan' : (isDowngrade ? 'Upgrade Only' : (isPending ? 'Pending Approval' : 'Subscribe Now')))}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>}>
      <BillingContent />
    </Suspense>
  );
}
