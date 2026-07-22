export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Terms and Conditions</h1>
        <p className="text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Introduction</h2>
            <p>Welcome to QR Dine. By using our website and services, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Service Usage</h2>
            <p>Our service provides QR menu generation and order management for restaurants. You agree to use the service only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. Subscriptions and Payments</h2>
            <p>Certain aspects of the service may be provided for a fee or other charge. If you elect to use paid features, you agree to the pricing and payment terms as we may update them from time to time. All payments are securely processed through PayHere.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Limitation of Liability</h2>
            <p>QR Dine shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at support@qrdine.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
