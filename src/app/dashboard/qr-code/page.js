"use client";

import { Download, Link as LinkIcon, Printer, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useRef, useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import toast from 'react-hot-toast';

export default function QRCodeBuilderPage() {
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const qrRef = useRef(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    const fetchSettings = async () => {
      try {
        const res = await fetchWithAuth('/api/tenant/settings');
        const data = await res.json();
        setSlug(data.slug || '');
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const menuUrl = slug ? `${origin}/menu/${slug}` : `${origin}/menu/setup`;

  const downloadQR = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Menu_${slug}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">QR Code Builder</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Generate and download your restaurant's custom QR menu.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* QR Code Display & Download */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center">
          <div className="bg-slate-50 dark:bg-white p-6 rounded-3xl border border-slate-200 dark:border-white shadow-sm" ref={qrRef}>
            <QRCode 
              value={menuUrl} 
              size={256}
              level="H"
              fgColor="#1e293b" // Slate 800
              bgColor="transparent"
            />
          </div>
          
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mt-8 mb-2">Scan to view menu</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 text-center max-w-xs">
            Print this QR code and place it on your tables. Customers can scan it directly without an app.
          </p>

          <div className="flex gap-4 w-full">
            <button 
              onClick={downloadQR}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20"
            >
              <Download size={18} /> Download High-Res
            </button>
            <button className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-md">
              <Printer size={18} />
            </button>
          </div>
        </div>

        {/* Link Sharing & Options */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Your Menu Link</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={menuUrl} 
                readOnly
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 outline-none" 
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(menuUrl);
                  toast.success('Link copied to clipboard!');
                }}
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <LinkIcon size={16} /> Copy
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-3">
              Share this link on your social media (Instagram bio, Facebook page) so customers can view your menu anywhere.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Print Guidelines</h3>
            <ul className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">1</div>
                Print the QR code at least 2x2 inches (5x5 cm) for easy scanning.
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">2</div>
                Avoid placing QR codes on highly reflective surfaces (like glass) or curved areas.
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">3</div>
                Ensure good lighting where the QR code is placed on the table.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
