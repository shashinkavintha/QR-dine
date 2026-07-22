export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Refund Policy</h1>
        <p className="text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. No Refund Policy</h2>
            <p>At QR Dine, we offer a comprehensive 14-day free trial so you can fully evaluate our digital menu system before making a purchase. Because of this, <strong>all subscription payments are final and non-refundable</strong> once a purchase is made.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Subscription Cancellations</h2>
            <p>You can cancel your subscription at any time to prevent future billing. Since we do not automatically renew your subscription or save your card details, your account will simply expire at the end of your billing cycle unless you manually renew it. We do not provide refunds or credits for any partial-month subscription periods or unused services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. Contact Us</h2>
            <p>If you have any questions or concerns about our policy before purchasing, please do not hesitate to contact us at support@qrdine.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
