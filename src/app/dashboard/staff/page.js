"use client";

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2, Mail } from 'lucide-react';

export default function StaffAndRolesPage() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' or 'roles'

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [inviting, setInviting] = useState(false);

  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [creatingRole, setCreatingRole] = useState(false);

  const formatPermissionName = (name) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const fetchStaffAndRoles = async () => {
    try {
      setLoading(true);
      // Wait for endpoints to be created by backend
      const resRoles = await fetchWithAuth('/api/tenant/roles').catch(() => ({ ok: false }));
      if (resRoles.ok) {
        const rolesData = await resRoles.json();
        setRoles(rolesData || []);
        if (rolesData?.length > 0 && !inviteRole) {
          setInviteRole(rolesData[0].id);
        }
      }

      const resStaff = await fetchWithAuth('/api/tenant/staff').catch(() => ({ ok: false }));
      if (resStaff.ok) {
        const staffData = await resStaff.json();
        setStaff(staffData || []);
      }

      const resPerms = await fetchWithAuth('/api/tenant/permissions').catch(() => ({ ok: false }));
      if (resPerms.ok) {
        const permsData = await resPerms.json();
        setAvailablePermissions(permsData || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndRoles();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!inviteRole) return toast.error("Please create a role first.");
    if (invitePassword.length < 6) return toast.error("Password must be at least 6 characters.");
    
    try {
      setInviting(true);
      const res = await fetchWithAuth('/api/tenant/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, password: invitePassword, role_id: inviteRole })
      });
      
      const responseData = await res.json().catch(() => null);
      if (!res.ok) throw new Error(responseData?.message || "Failed to create staff");
      
      toast.success("Staff member created successfully.");
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      fetchStaffAndRoles();
    } catch (error) {
      toast.error(error.message || 'Error creating staff');
    } finally {
      setInviting(false);
    }
  };

  const handleToggleStatus = async (staffId) => {
    try {
      const res = await fetchWithAuth(`/api/tenant/staff/${staffId}/toggle-status`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Status updated");
      fetchStaffAndRoles();
    } catch (error) {
      toast.error(error.message || "Error updating status");
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    try {
      const res = await fetchWithAuth(`/api/tenant/staff/${staffId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("Failed to delete staff");
      toast.success("Staff member deleted");
      fetchStaffAndRoles();
    } catch (error) {
      toast.error(error.message || "Error deleting staff");
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      setCreatingRole(true);
      const url = editingRole ? `/api/tenant/roles/${editingRole.id}` : '/api/tenant/roles';
      const method = editingRole ? 'PUT' : 'POST';
      const res = await fetchWithAuth(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName, permissions: rolePermissions })
      });
      if (!res.ok) throw new Error(`Failed to ${editingRole ? 'update' : 'create'} role`);
      toast.success(`Role ${editingRole ? 'updated' : 'created'} successfully.`);
      setNewRoleName('');
      setEditingRole(null);
      setRolePermissions([]);
      fetchStaffAndRoles();
    } catch (error) {
      toast.error(error.message || `Error ${editingRole ? 'updating' : 'creating'} role`);
    } finally {
      setCreatingRole(false);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setRolePermissions(role.permissions?.map(p => p.id) || []);
  };

  const togglePermission = (permId) => {
    if (rolePermissions.includes(permId)) {
      setRolePermissions(rolePermissions.filter(id => id !== permId));
    } else {
      setRolePermissions([...rolePermissions, permId]);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff & Roles</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your team members and control their access permissions.</p>
      </div>

      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-max">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'staff' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
        >
          Team Members
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'roles' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
        >
          Roles & Permissions
        </button>
      </div>

      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold mb-4">Active Staff</h2>
            {staff.length === 0 ? (
              <p className="text-sm text-slate-500">No staff members found.</p>
            ) : (
              <div className="space-y-4">
                {staff.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                        {s.name ? s.name.charAt(0).toUpperCase() : s.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm">
                          {s.name || s.email}
                          {!s.is_active && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Inactive</span>}
                        </div>
                        <div className="text-xs text-slate-500">{s.email} • {s.roles && s.roles.length > 0 ? s.roles.map(r => r.name).join(', ') : 'No Role'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleToggleStatus(s.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          s.is_active ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => handleDeleteStaff(s.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-max">
            <h2 className="text-lg font-bold mb-4">Create Staff Member</h2>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    placeholder="staff@hotel.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  required
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="">Select a role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <button disabled={inviting} type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                {inviting ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Create Staff</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold mb-4">Roles</h2>
            {roles.length === 0 ? (
              <p className="text-sm text-slate-500">No roles defined.</p>
            ) : (
              <div className="space-y-4">
                {roles.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm mb-2">{r.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {r.permissions?.length > 0 ? r.permissions.map(p => (
                          <span key={p.id} className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">{formatPermissionName(p.name)}</span>
                        )) : (
                          <span className="text-xs text-slate-400">No permissions</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleEditRole(r)} className="text-sm font-medium text-orange-500 hover:text-orange-600 px-2 py-1 bg-orange-50 dark:bg-orange-500/10 rounded">
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-max">
            <h2 className="text-lg font-bold mb-4">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role Name</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. Waiter"
                />
              </div>
              
              {availablePermissions.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Permissions</label>
                  <div className="space-y-2">
                    {availablePermissions.map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={rolePermissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                        />
                        {formatPermissionName(perm.name)}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {editingRole && (
                  <button type="button" onClick={() => { setEditingRole(null); setNewRoleName(''); setRolePermissions([]); }} className="w-1/3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm py-2 rounded-lg transition-colors">
                    Cancel
                  </button>
                )}
                <button disabled={creatingRole} type="submit" className="flex-1 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-medium text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {creatingRole ? <Loader2 size={16} className="animate-spin" /> : (editingRole ? 'Update Role' : 'Save Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
