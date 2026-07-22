import Navbar from '@/components/Navbar';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import TrustSignals from '@/components/TrustSignals';
import ProductShowcase from '@/components/ProductShowcase';
import HowItWorks from '@/components/HowItWorks';
import Pricing from '@/components/Pricing';
import Testimonials from '@/components/Testimonials';
import BottomCTA from '@/components/BottomCTA';
import { Mail, Phone, MapPin } from 'lucide-react';
import FadeIn from '@/components/FadeIn';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-500 selection:text-white overflow-x-hidden">
      <Navbar />

      <main>
        <HeroSection />
        <TrustSignals />
        <ProductShowcase />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <BottomCTA />
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-slate-950 text-slate-300 py-20 px-6 lg:px-12">
        <FadeIn direction="none">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 border-b border-slate-800 pb-16 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <img src="/logo.png" alt="QR Dine Logo" className="h-[120px] sm:h-[150px] w-auto max-w-[300px] object-contain drop-shadow-md -my-8" />
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed text-lg">
                Empowering restaurants and hotels with modern, contactless digital dining experiences.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 text-lg tracking-wide">Quick Links</h4>
              <ul className="space-y-4 font-medium">
                <li><a href="#home" className="hover:text-orange-400 transition-colors">Home</a></li>
                <li><a href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 text-lg tracking-wide">Contact Us</h4>
              <ul className="space-y-5 font-medium">
                <li className="flex items-start gap-4">
                  <Mail size={22} className="text-orange-400 shrink-0 mt-0.5" />
                  <span className="hover:text-white transition-colors cursor-pointer">support@qrsaas.com</span>
                </li>
                <li className="flex items-start gap-4">
                  <Phone size={22} className="text-orange-400 shrink-0 mt-0.5" />
                  <span className="hover:text-white transition-colors cursor-pointer">+1 (555) 123-4567</span>
                </li>
                <li className="flex items-start gap-4">
                  <MapPin size={22} className="text-orange-400 shrink-0 mt-0.5" />
                  <span>123 Innovation Drive,<br/>Tech City, TC 10100</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 font-medium pt-8">
            <p>© 2026 QR Dine. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
              <a href="#contact" className="hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>
        </FadeIn>
      </footer>
    </div>
  );
}
