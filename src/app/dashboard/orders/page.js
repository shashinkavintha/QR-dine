"use client";

import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { Loader2, Clock, ChefHat, CheckCircle2, X, Printer, Bell, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import WaiterNotificationWidget from '@/components/dashboard/WaiterNotificationWidget';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [waiterRequests, setWaiterRequests] = useState([]);
  const [resolvingIds, setResolvingIds] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [echoInstance, setEchoInstance] = useState(null);

  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetchWithAuth('/api/tenant/orders');
      const data = await res.json();
      const fetchedOrders = Array.isArray(data) ? data : [];
      setOrders(fetchedOrders);
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchWaiterRequests = async () => {
    try {
      const res = await fetchWithAuth('/api/tenant/waiter-requests?status=pending');
      if (res.ok) {
        const data = await res.json();
        const pending = Array.isArray(data) ? data.filter(r => r.status === 'pending') : [];
        setWaiterRequests(pending);
      }
    } catch (e) {
      console.error('Failed to fetch waiter requests:', e);
    }
  };

  const completeWaiterRequest = async (id) => {
    setResolvingIds(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetchWithAuth(`/api/tenant/waiter-requests/${id}/complete`, {
        method: 'POST'
      });
      if (res.ok) {
        toast.success('Waiter request marked as complete');
        setWaiterRequests(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error('Failed to complete waiter request');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to complete waiter request');
    } finally {
      setResolvingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchWaiterRequests();

    const interval = setInterval(() => {
      fetchWaiterRequests();
    }, 10000);

    const setupEcho = async () => {
      const userRes = await fetchWithAuth('/api/user');
      if (!userRes.ok) return;
      const user = await userRes.json();
      const tenantId = user.role === 'staff' ? user.tenant_id : user.id;

      import('@/lib/echo').then(({ default: getEcho }) => {
        const token = localStorage.getItem('tenant_token');
        const echo = getEcho(token);
        setEchoInstance(echo);

        echo.private(`tenant.orders.${tenantId}`)
          .listen('.App\\Events\\OrderCreated', (e) => {
            setOrders(prev => {
              if (prev.find(o => o.id === e.order.id)) return prev;
              return [e.order, ...prev];
            });
            toast.success('New Order Received!');
          })
          .listen('.App\\Events\\OrderStatusUpdated', (e) => {
            setOrders(prev => prev.map(o => o.id === e.order.id ? e.order : o));
          })
          .listen('.App\\Events\\WaiterRequestCreated', (e) => {
            fetchWaiterRequests();
            const req = e.waiterRequest || e;
            const tableStr = req.table_number ? `Table ${req.table_number}` : 'A table';
            const typeStr = req.request_type ? req.request_type.toUpperCase() : 'WAITER';
            toast.error(`🔔 ${tableStr} requested ${typeStr}!`, { duration: 6000 });
          })
          .listen('.WaiterRequestCreated', (e) => {
            fetchWaiterRequests();
            const req = e.waiterRequest || e;
            const tableStr = req.table_number ? `Table ${req.table_number}` : 'A table';
            const typeStr = req.request_type ? req.request_type.toUpperCase() : 'WAITER';
            toast.error(`🔔 ${tableStr} requested ${typeStr}!`, { duration: 6000 });
          });
      });
    };

    setupEcho();

    return () => {
      clearInterval(interval);
      if (echoInstance) {
        echoInstance.disconnect();
      }
    };
  }, []);

  const updateStatus = async (id, status) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await fetchWithAuth(`/api/tenant/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Order marked as ${status}`);
        fetchOrders();
      } else {
        toast.error('Failed to update order status');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const [isPrinting, setIsPrinting] = useState(false);

  const printKOT = async (order) => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      await fetchWithAuth(`/api/tenant/orders/${order.id}/print`, {
        method: 'POST'
      });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, is_printed: true } : o));
      
      const printWindow = window.open('', '_blank');
      const itemsHtml = order.items?.map(item => `
        <tr style="border-bottom: 1px dashed #ccc;">
          <td style="padding: 8px 0; font-weight: bold;">
            ${item.menu_item?.name || 'Unknown Item'} ${item.portion ? `(${item.portion})` : ''}
            ${item.selected_modifiers?.length ? `<div style="font-size: 10px; font-style: italic; font-weight: normal;">+ ${item.selected_modifiers.map(m=>m.name).join(', ')}</div>` : ''}
          </td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; vertical-align: top;">${item.quantity}</td>
        </tr>
      `).join('') || '';

      const html = `
        <html>
          <head>
            <title>KOT - Order #${order.id}</title>
            <style>
              @page { margin: 0; size: 80mm auto; }
              body { font-family: monospace; padding: 0; margin: 0; width: 80mm; color: black; background: white; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .border-b { border-bottom: 1px solid black; }
              .pb-2 { padding-bottom: 8px; }
              .mt-1 { margin-top: 4px; }
              .mb-4 { margin-bottom: 16px; }
              table { width: 100%; border-collapse: collapse; }
              th { border-bottom: 1px solid black; padding: 4px 0; }
            </style>
          </head>
          <body>
            <div style="padding: 16px; font-size: 12px;">
              <div class="text-center mb-4">
                <h2 style="font-size: 18px; margin: 0 0 4px 0;">KITCHEN ORDER TICKET</h2>
                <p class="border-b pb-2" style="margin: 0;">Order #${order.id}</p>
              </div>
              <div class="mb-4">
                <p style="margin: 0 0 4px 0;"><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()} ${new Date(order.created_at).toLocaleTimeString()}</p>
                <p style="margin: 0;"><strong>Table:</strong> ${(order.tableQr || order.table_qr) ? (order.tableQr || order.table_qr).table_number : 'Takeaway'}</p>
              </div>
              <table style="border-top: 1px solid black; border-bottom: 1px solid black; margin-bottom: 16px;">
                <thead>
                  <tr>
                    <th style="text-align: left; width: 70%;">Item</th>
                    <th style="text-align: right; width: 30%;">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              <div class="text-center" style="margin-top: 24px;">
                <p>*** END OF KOT ***</p>
              </div>
            </div>
            <script>
              window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 250); }
            </${'script'}>
          </body>
        </html>
      `;
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate KOT');
    } finally {
      setIsPrinting(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const completedOrders = orders.filter(o => o.status === 'completed');

  const OrderCard = ({ order }) => (
    <div 
      className="bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
      onClick={() => setSelectedOrder(order)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">
            {(order.tableQr || order.table_qr) ? (order.tableQr || order.table_qr).table_number : 'Takeaway / Unknown Table'}
          </span>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Order #{order.id} • {new Date(order.created_at).toLocaleTimeString()}</div>
        </div>
        <div className="font-bold text-orange-600">
          {order.currency} {parseFloat(order.total_amount).toFixed(2)}
        </div>
      </div>
      <div className="space-y-3 mb-4">
        {order.items?.map(item => (
          <div key={item.id} className="text-sm text-slate-600 dark:text-slate-300">
            <div className="flex justify-between font-medium">
              <span>{item.quantity}x {item.menu_item?.name} {item.portion ? `(${item.portion})` : ''}</span>
            </div>
            {item.selected_modifiers && item.selected_modifiers.length > 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-4">
                + {item.selected_modifiers.map(m => m.name).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-auto pt-2">
        {order.status === 'pending' && (
          <>
            <button disabled={isUpdating} onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'preparing'); }} className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {isUpdating && <Loader2 size={16} className="animate-spin" />} Accept
            </button>
            <button disabled={isUpdating} onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'cancelled'); }} className="flex-1 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 py-2 rounded-lg text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2">
              Reject
            </button>
          </>
        )}
        {order.status === 'preparing' && (
          <button disabled={isUpdating} onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'completed'); }} className="w-full bg-green-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {isUpdating && <Loader2 size={16} className="animate-spin" />} Mark Ready
          </button>
        )}
        {order.status === 'completed' && (
          <div className="w-full text-center text-green-600 dark:text-green-400 font-bold text-sm py-2 bg-green-50 dark:bg-green-500/10 rounded-lg">Completed</div>
        )}
      </div>
    </div>
  );

  return (
    <>
    <div className="space-y-6 print:hidden">
      {/* Waiter Calls Notification Panel */}
      <WaiterNotificationWidget
        waiterRequests={waiterRequests}
        resolvingIds={resolvingIds}
        onCompleteRequest={completeWaiterRequest}
      />

      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Live Orders</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Manage incoming orders from tables.</p>
      </div>

      <div className="flex lg:grid lg:grid-cols-3 gap-6 overflow-x-auto snap-x snap-mandatory pb-4">
        {/* Pending Column */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 flex flex-col h-[calc(100vh-180px)] min-w-[85vw] lg:min-w-0 snap-center shrink-0">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Clock size={20} className="text-rose-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">New / Pending ({pendingOrders.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {pendingOrders.map(o => <OrderCard key={o.id} order={o} />)}
            {pendingOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm mt-12 opacity-50">
                <Clock size={32} className="mb-3" />
                <span>No new orders</span>
              </div>
            )}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 flex flex-col h-[calc(100vh-180px)] min-w-[85vw] lg:min-w-0 snap-center shrink-0">
          <div className="flex items-center gap-2 mb-4 px-2">
            <ChefHat size={20} className="text-orange-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Preparing ({preparingOrders.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {preparingOrders.map(o => <OrderCard key={o.id} order={o} />)}
            {preparingOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm mt-12 opacity-50">
                <ChefHat size={32} className="mb-3" />
                <span>No orders preparing</span>
              </div>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 flex flex-col h-[calc(100vh-180px)] min-w-[85vw] lg:min-w-0 snap-center shrink-0">
          <div className="flex items-center gap-2 mb-4 px-2">
            <CheckCircle2 size={20} className="text-green-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Completed (Recent)</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {completedOrders.slice(0, 20).map(o => <OrderCard key={o.id} order={o} />)}
            {completedOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm mt-12 opacity-50">
                <CheckCircle2 size={32} className="mb-3" />
                <span>No completed orders</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div 
            className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {(selectedOrder.tableQr || selectedOrder.table_qr) ? `Table ${(selectedOrder.tableQr || selectedOrder.table_qr).table_number}` : 'Takeaway Order'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Order #{selectedOrder.id}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => printKOT(selectedOrder)}
                  disabled={isPrinting}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
                >
                  {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} 
                  {isPrinting ? 'Printing...' : 'Print KOT'}
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Date & Time</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    {new Date(selectedOrder.created_at).toLocaleDateString()} at {new Date(selectedOrder.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedOrder.status === 'pending' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' :
                    selectedOrder.status === 'preparing' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' :
                    selectedOrder.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                    'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Order Items</h4>
                <div className="space-y-4">
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          {item.quantity}x {item.menu_item?.name} {item.portion ? `(${item.portion})` : ''}
                        </p>
                        {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                            {item.selected_modifiers.map(m => (
                              <div key={m.name}>+ {m.name}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap ml-4">
                        {selectedOrder.currency} {(item.quantity * item.unit_price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex justify-between items-center">
                <span className="font-bold text-slate-600 dark:text-slate-300 text-lg">Total Amount</span>
                <span className="font-extrabold text-2xl text-orange-600 dark:text-orange-500">
                  {selectedOrder.currency} {parseFloat(selectedOrder.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3">
              {selectedOrder.status === 'pending' && (
                <>
                  <button disabled={isUpdating} onClick={() => { updateStatus(selectedOrder.id, 'preparing'); setSelectedOrder(null); }} className="flex-1 bg-orange-500 text-white py-3.5 rounded-xl font-bold hover:bg-orange-600 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {isUpdating && <Loader2 size={18} className="animate-spin" />} Accept Order
                  </button>
                  <button disabled={isUpdating} onClick={() => { updateStatus(selectedOrder.id, 'cancelled'); setSelectedOrder(null); }} className="flex-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 py-3.5 rounded-xl font-bold hover:bg-rose-50 dark:hover:bg-slate-700 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    Reject
                  </button>
                </>
              )}
              {selectedOrder.status === 'preparing' && (
                <button disabled={isUpdating} onClick={() => { updateStatus(selectedOrder.id, 'completed'); setSelectedOrder(null); }} className="w-full bg-green-500 text-white py-3.5 rounded-xl font-bold hover:bg-green-600 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {isUpdating && <Loader2 size={18} className="animate-spin" />} Mark Ready
                </button>
              )}
              {selectedOrder.status === 'completed' && (
                <div className="w-full text-center text-green-600 dark:text-green-400 font-bold py-3.5 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">Order Completed</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KOT handled via window.print in the printKOT function */}

    </div>
    </>
  );
}
