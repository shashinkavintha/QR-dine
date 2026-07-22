"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, ShieldAlert, Clock, CheckCircle2, XCircle, X, Edit, Ban, Trash2 } from 'lucide-react';
import { fetchWithSuperAdminAuth as fetchWithAuth } from '@/utils/api';

export default function TenantsPage() {
  const [filter, setFilter] = useState('All');
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState({ id: '', name: '', email: '' });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await fetchWithAuth('/api/super-admin/tenants');
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/super-admin/tenants', {
        method: 'POST',
        body: JSON.stringify(newTenant)
      });
      if (!res.ok) throw new Error('Failed to add tenant');
      setIsModalOpen(false);
      setNewTenant({ name: '', email: '', password: '' });
      fetchTenants();
    } catch (error) {
      console.error('Error adding tenant:', error);
      alert('Failed to add tenant.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTenant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/super-admin/tenants/${editingTenant.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingTenant.name, email: editingTenant.email })
      });
      if (!res.ok) throw new Error('Failed to update tenant');
      setIsEditModalOpen(false);
      fetchTenants();
    } catch (error) {
      console.error('Error editing tenant:', error);
      alert('Failed to update tenant.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSuspend = async (id, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unsuspend' : 'suspend'} this account?`)) return;
    try {
      const res = await fetchWithAuth(`/api/super-admin/tenants/${id}/suspend`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to change suspension status');
      fetchTenants();
    } catch (error) {
      console.error('Error toggling suspension:', error);
      alert('Failed to change suspension status.');
    }
  };

  const handleDeleteTenant = async (id, name) => {
    if (!confirm(`WARNING: Are you sure you want to permanently delete the tenant "${name}" and all associated data? This cannot be undone.`)) return;
    try {
      const res = await fetchWithAuth(`/api/super-admin/tenants/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete tenant');
      fetchTenants();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Failed to delete tenant.');
    }
  };

  const handleExtendTrial = async (id, name) => {
    const daysStr = prompt(`How many days do you want to extend the trial for ${name}?`, "7");
    if (!daysStr) return; // User cancelled
    
    const days = parseInt(daysStr, 10);
    if (isNaN(days) || days <= 0) {
      alert("Please enter a valid number of days.");
      return;
    }

    try {
      await fetchWithAuth(`/api/super-admin/tenants/${id}/extend-trial`, {
        method: 'POST',
        body: JSON.stringify({ days })
      });
      fetchTenants();
    } catch (error) {
      console.error('Error extending trial:', error);
      alert('Failed to extend trial.');
    }
  };

  const filteredTenants = filter === 'All' ? tenants : tenants.filter(t => t.status === filter);

  if (loading) {
    return <div className="p-8 text-center font-medium text-slate-500">Loading tenants...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tenant Management</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage hotels, subscriptions, and free trials.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tenants..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            + Add Tenant
          </button>
        </div>
      </div>

      {/* Trial Monitoring Filters */}
      <div className="flex gap-2">
        {['All', 'Active', 'Trialing', 'Expired'].map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === f 
              ? 'bg-slate-800 text-white shadow-md' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="px-6 py-4 font-bold">Tenant Name</th>
                <th className="px-6 py-4 font-bold">Plan / MRR</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Expires / Valid Until</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
                        {tenant.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{tenant.name}</div>
                        <div className="text-xs text-slate-500 font-medium">{tenant.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-sm">{tenant.plan}</div>
                    <div className="text-xs text-slate-500 font-medium">{tenant.mrr}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                      ${tenant.is_suspended ? 'bg-rose-100 text-rose-700' :
                        tenant.status === 'Active' ? 'bg-green-100 text-green-700' : 
                        tenant.status === 'Trialing' ? 'bg-orange-100 text-orange-700' : 
                        'bg-rose-100 text-rose-700'}`}>
                      {tenant.is_suspended && <Ban size={14} />}
                      {!tenant.is_suspended && tenant.status === 'Active' && <CheckCircle2 size={14} />}
                      {!tenant.is_suspended && tenant.status === 'Trialing' && <Clock size={14} />}
                      {!tenant.is_suspended && tenant.status === 'Expired' && <XCircle size={14} />}
                      {tenant.is_suspended ? 'Suspended' : tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 font-medium">
                      {tenant.trialEnds || '-'}
                    </div>
                    {tenant.status === 'Active' && (
                      <div className="text-xs text-green-600 font-bold mt-0.5">Active Subscription</div>
                    )}
                    {tenant.status === 'Trialing' && (
                      <div className="text-xs text-orange-500 font-bold mt-0.5">Free Trial</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 relative">
                      {tenant.status === 'Trialing' || tenant.status === 'Expired' ? (
                        <button 
                          onClick={() => handleExtendTrial(tenant.id, tenant.name)}
                          className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold text-xs rounded-lg transition-colors"
                        >
                          Extend Trial
                        </button>
                      ) : null}
                      
                      <div className="relative">
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === tenant.id ? null : tenant.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {openDropdownId === tenant.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-20 overflow-hidden">
                              <button 
                                onClick={() => { 
                                  setEditingTenant({ id: tenant.id, name: tenant.name, email: tenant.email });
                                  setIsEditModalOpen(true);
                                  setOpenDropdownId(null); 
                                }}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                              >
                                <Edit size={16} />
                                Edit Tenant
                              </button>
                              <button 
                                onClick={() => { handleToggleSuspend(tenant.id, tenant.is_suspended); setOpenDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                              >
                                <Ban size={16} className={tenant.is_suspended ? "text-green-500" : ""} />
                                {tenant.is_suspended ? 'Unsuspend Account' : 'Suspend Account'}
                              </button>
                              <div className="h-px bg-slate-100 my-1"></div>
                              <button 
                                onClick={() => { handleDeleteTenant(tenant.id, tenant.name); setOpenDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                Delete Tenant
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTenants.length === 0 && (
          <div className="p-12 text-center text-slate-500 font-medium">
            No tenants found for this filter.
          </div>
        )}
      </div>

      {/* Add Tenant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Add New Tenant</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Hotel / Restaurant Name</label>
                <input 
                  type="text" 
                  required
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500" 
                  placeholder="e.g. Grand Plaza Hotel"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Admin Email</label>
                <input 
                  type="email" 
                  required
                  value={newTenant.email}
                  onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500" 
                  placeholder="admin@grandplaza.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Initial Password</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={newTenant.password}
                  onChange={(e) => setNewTenant({...newTenant, password: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500" 
                  placeholder="Min 6 characters"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Edit Tenant</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Hotel / Restaurant Name</label>
                <input 
                  type="text" 
                  required
                  value={editingTenant.name}
                  onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Admin Email</label>
                <input 
                  type="email" 
                  required
                  value={editingTenant.email}
                  onChange={(e) => setEditingTenant({...editingTenant, email: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500" 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
