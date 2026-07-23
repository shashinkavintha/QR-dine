"use client";

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { Loader2, Plus, Trash2, Download, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EmptyState from '@/components/ui/EmptyState';

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [newTable, setNewTable] = useState('');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isSubmitting: false });
  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    fetchTablesAndSettings();
  }, []);

  const fetchTablesAndSettings = async () => {
    try {
      const [tablesRes, settingsRes] = await Promise.all([
        fetchWithAuth('/api/tenant/tables'),
        fetchWithAuth('/api/tenant/settings')
      ]);
      const tablesData = await tablesRes.json();
      const settingsData = await settingsRes.json();
      
      setTables(Array.isArray(tablesData) ? tablesData : []);
      if (settingsData && settingsData.slug) {
        setSlug(settingsData.slug);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const addTable = async () => {
    if (!newTable.trim()) {
      toast.error("Please enter a table name first!");
      return;
    }
    setAdding(true);
    try {
      const res = await fetchWithAuth('/api/tenant/tables', {
        method: 'POST',
        body: JSON.stringify({ table_number: newTable })
      });
      if (res.ok) {
        setNewTable('');
        fetchTablesAndSettings();
        toast.success("Table added successfully");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to add table");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred");
    } finally {
      setAdding(false);
    }
  };

  const deleteTable = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Table',
      message: 'Are you sure you want to delete this table? This action cannot be undone.',
      isSubmitting: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isSubmitting: true }));
        try {
          await fetchWithAuth(`/api/tenant/tables/${id}`, { method: 'DELETE' });
          toast.success('Table deleted successfully');
          fetchTablesAndSettings();
        } catch (e) {
          console.error(e);
          toast.error('Failed to delete table');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const downloadQR = (hash, tableNumber) => {
    const svg = document.getElementById(`qr-${hash}`);
    if(!svg) return;
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
      downloadLink.download = `Table_${tableNumber}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  return (
    <div className="space-y-6">
      <ConfirmModal {...confirmModal} onClose={closeConfirmModal} />
      
      {/* Tables Section Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tables & QRs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Manage tables and generate unique QR codes for ordering.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="e.g. Table 5"
            value={newTable}
            onChange={e => setNewTable(e.target.value)}
            className="flex-1 md:w-48 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-orange-500 dark:text-slate-200"
            onKeyDown={e => e.key === 'Enter' && addTable()}
          />
          <button 
            onClick={addTable}
            disabled={adding}
            className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50 flex gap-2 items-center shrink-0"
          >
            {adding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            Add Table
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.length === 0 && (
          <EmptyState 
            icon={QrCode} 
            title="No Tables Found" 
            description="Add your first table to generate a QR code for customers to scan and order." 
          />
        )}
        {tables.map(table => {
          const qrUrl = `${backendUrl}/api/r/${table.redirect_hash}`;
          return (
            <div key={table.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">{table.table_number}</h3>
              
              <div className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mr-2">{qrUrl}</span>
                <button 
                  onClick={() => copyToClipboard(qrUrl)}
                  className="text-orange-500 hover:text-orange-600 font-bold text-xs shrink-0"
                >
                  {copied === qrUrl ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              
              <div className="bg-slate-50 dark:bg-white p-4 rounded-xl mb-4 border border-slate-100 dark:border-white">
                <QRCode 
                  id={`qr-${table.redirect_hash}`}
                  value={qrUrl} 
                  size={150}
                  level="H"
                  fgColor="#1e293b"
                />
              </div>

              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => downloadQR(table.redirect_hash, table.table_number)}
                  className="flex-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition"
                >
                  <Download size={16} /> QR
                </button>
                <button 
                  onClick={() => deleteTable(table.id)}
                  className="p-2 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
