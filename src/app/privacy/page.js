export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Privacy Policy</h1>
        <p className="text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us, such as when you create or modify your account, request customer support, or otherwise communicate with us. This may include your name, email address, phone number, and payment information.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send related information including confirmations and invoices, and to communicate with you about products, services, offers, and events.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. Information Sharing</h2>
            <p>We do not share your personal information with third parties except as necessary to provide our services (e.g., payment processing via PayHere) or as required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Security</h2>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@qrdine.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
