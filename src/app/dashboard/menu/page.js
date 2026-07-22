"use client";

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Image as ImageIcon, Loader2, X, Upload, ListX } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EmptyState from '@/components/ui/EmptyState';

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function MenuManagementPage() {
  const [categories, setCategories] = useState([]);
  const [trashedItems, setTrashedItems] = useState([]);
  const [trashedCategories, setTrashedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('Rs. ');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'trash'
  const [userRole, setUserRole] = useState('admin'); // default full access
  const canEditMenu = userRole !== 'waiter' && userRole !== 'cashier';

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isSubmitting: false });

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const fetchData = async () => {
    try {
      const [settingsRes, menuRes, trashRes, trashCatRes] = await Promise.all([
        fetchWithAuth('/api/tenant/settings'),
        fetchWithAuth('/api/tenant/menu'),
        fetchWithAuth('/api/tenant/menu/items/trashed').catch(() => ({ ok: false })),
        fetchWithAuth('/api/tenant/menu/categories/trashed').catch(() => ({ ok: false }))
      ]);
      const settings = await settingsRes.json();
      setCurrency(settings.settings?.currency || 'Rs. ');
      if (settings.user?.role) setUserRole(settings.user.role.toLowerCase());
      
      const data = await menuRes.json();
      setCategories(data);
      if (trashRes.ok) {
        const trashedData = await trashRes.json();
        setTrashedItems(trashedData || []);
      }
      if (trashCatRes.ok) {
        const trashedCatData = await trashCatRes.json();
        setTrashedCategories(trashedCatData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteCategory = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category and all its items? This action cannot be undone.',
      isSubmitting: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isSubmitting: true }));
        try {
          await fetchWithAuth(`/api/tenant/menu/categories/${id}`, { method: 'DELETE' });
          setCategories(categories.filter(c => c.id !== id));
          toast.success('Category deleted successfully');
          fetchData();
        } catch (error) {
          toast.error('Failed to delete category');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleDeleteItem = (categoryId, itemId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Item',
      message: 'Are you sure you want to delete this menu item?',
      isSubmitting: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isSubmitting: true }));
        try {
          await fetchWithAuth(`/api/tenant/menu/items/${itemId}`, { method: 'DELETE' });
          setCategories(categories.map(c => {
            if (c.id === categoryId) {
              return { ...c, items: c.items.filter(i => i.id !== itemId) };
            }
            return c;
          }));
          toast.success('Item deleted successfully');
          fetchData();
        } catch (error) {
          toast.error('Failed to delete item');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleToggleAvailable = async (category, item) => {
    try {
      const res = await fetchWithAuth(`/api/tenant/menu/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, is_available: !item.is_available })
      });
      const updated = await res.json();
      setCategories(categories.map(c => {
        if (c.id === category.id) {
          return { ...c, items: c.items.map(i => i.id === item.id ? updated : i) };
        }
        return c;
      }));
      toast.success(`Item marked as ${updated.is_available ? 'available' : 'unavailable'}`);
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const handleRestoreItem = async (itemId) => {
    try {
      await fetchWithAuth(`/api/tenant/menu/items/${itemId}/restore`, { method: 'POST' });
      fetchData();
      toast.success('Item restored successfully!');
    } catch (error) {
      toast.error('Failed to restore item');
    }
  };

  const handleRestoreCategory = async (categoryId) => {
    try {
      await fetchWithAuth(`/api/tenant/menu/categories/${categoryId}/restore`, { method: 'POST' });
      fetchData();
      toast.success('Category restored successfully!');
    } catch (error) {
      toast.error('Failed to restore category');
    }
  };

  const handleForceDeleteCategory = (categoryId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete Category',
      message: 'Are you sure you want to permanently delete this category? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isSubmitting: true }));
        try {
          await fetchWithAuth(`/api/tenant/menu/categories/${categoryId}/force`, { method: 'DELETE' });
          fetchData();
          toast.success('Category permanently deleted');
        } catch (error) {
          toast.error('Failed to permanently delete category');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleForceDeleteItem = (itemId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete Item',
      message: 'Are you sure you want to permanently delete this item? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isSubmitting: true }));
        try {
          await fetchWithAuth(`/api/tenant/menu/items/${itemId}/force`, { method: 'DELETE' });
          fetchData();
          toast.success('Item permanently deleted');
        } catch (error) {
          toast.error('Failed to permanently delete item');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const openAddItem = (categoryId) => {
    setActiveCategoryId(categoryId);
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const openEditItem = (categoryId, item) => {
    setActiveCategoryId(categoryId);
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <ConfirmModal {...confirmModal} onClose={closeConfirmModal} />
      
      <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Menu Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Organize your categories and menu items.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              Active Menu
            </button>
            <button
              onClick={() => setActiveTab('trash')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'trash' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              Recycle Bin ({trashedItems.length + trashedCategories.length})
            </button>
          </div>
          {canEditMenu && (
            <button onClick={openAddCategory} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20">
              + Add Category
            </button>
          )}
        </div>
      </div>

      {activeTab === 'active' ? (
        <div className="space-y-6">
        {categories.length === 0 && (
          <EmptyState 
            icon={ListX} 
            title="No Menu Categories" 
            description="Start building your menu by adding your first category (e.g. Starters, Main Course)."
            action={canEditMenu && <button onClick={openAddCategory} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 shadow-md transition-colors">Add Category</button>}
          />
        )}
        {categories.map(category => (
          <div key={category.id} className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Category Header */}
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-2 -ml-2 cursor-grab active:cursor-grabbing text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <GripVertical size={18} />
                </div>
                {category.image_url && (
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                     <img src={getImageUrl(category.image_url)} className="w-full h-full object-cover" />
                  </div>
                )}
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{category.name}</h3>
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  {(category.items || []).length} Items
                </span>
              </div>
              {canEditMenu && (
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditCategory(category)} className="p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors" aria-label="Edit Category">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDeleteCategory(category.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" aria-label="Delete Category">
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {(category.items || []).map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 -ml-2 cursor-grab active:cursor-grabbing text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <GripVertical size={18} />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                      {item.image_url ? <img src={getImageUrl(item.image_url)} className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">{item.name}</h4>
                      {item.description && <p className="text-xs text-slate-500 mt-0.5 max-w-md line-clamp-1">{item.description}</p>}
                      <div className="text-sm font-bold text-orange-500 mt-0.5">
                        {Array.isArray(item.portions) && item.portions.length > 0 
                          ? `From ${currency}${Math.min(...item.portions.map(p => parseFloat(p.price))).toFixed(2)}`
                          : `${currency}${parseFloat(item.price || 0).toFixed(2)}`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-bold text-slate-500">{item.is_available ? 'Available' : 'Hidden'}</span>
                      <div className={`relative w-10 h-6 rounded-full transition-colors ${item.is_available ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                        <input type="checkbox" className="sr-only" checked={item.is_available} onChange={() => handleToggleAvailable(category, item)} />
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${item.is_available ? 'translate-x-4' : ''}`}></div>
                      </div>
                    </label>
                    {canEditMenu && (
                      <>
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <button onClick={() => openEditItem(category.id, item)} className="text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 p-3 rounded-lg transition-colors" aria-label="Edit Item">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteItem(category.id, item.id)} className="text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 p-3 rounded-lg transition-colors" aria-label="Delete Item">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {(!category.items || category.items.length === 0) && (
                <div className="p-8 text-center text-slate-500 text-sm font-medium">
                  No items in this category yet.
                </div>
              )}
              {canEditMenu && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
                  <button onClick={() => openAddItem(category.id)} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all">
                    + Add Menu Item
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">No categories found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Add your first category to start building your menu.</p>
            {canEditMenu && (
              <button onClick={openAddCategory} className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20">
                + Add Category
              </button>
            )}
          </div>
        )}
      </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30">
            <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
              <Trash2 size={18} />
              Recycle Bin
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              Deleted categories and items are kept here. You can restore them back to your menu.
              <span className="block mt-1 font-semibold text-red-700 dark:text-red-400">
                ⚠️ Items left in the recycle bin are automatically and permanently deleted after 30 days.
              </span>
            </p>
          </div>
          {trashedItems.length === 0 && trashedCategories.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Trash2 size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
              <p>Recycle bin is empty.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {trashedCategories.map(category => (
                <div key={`cat-${category.id}`} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4 opacity-75">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-400 shrink-0 overflow-hidden">
                      <ImageIcon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 strike-through">{category.name} (Category)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Deleted on: {new Date(category.deleted_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {canEditMenu && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleRestoreCategory(category.id)} className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                        Restore
                      </button>
                      <button onClick={() => handleForceDeleteCategory(category.id)} className="text-sm font-bold text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-md shadow-red-500/20">
                        Delete Permanently
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {trashedItems.map(item => (
                <div key={`item-${item.id}`} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4 opacity-75">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                      {item.image_url ? <img src={getImageUrl(item.image_url)} className="w-full h-full object-cover grayscale" /> : <ImageIcon size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 strike-through">{item.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Deleted on: {new Date(item.deleted_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {canEditMenu && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleRestoreItem(item.id)} className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                        Restore
                      </button>
                      <button onClick={() => handleForceDeleteItem(item.id)} className="text-sm font-bold text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-md shadow-red-500/20">
                        Delete Permanently
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CategoryModal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
        category={editingCategory}
        onSuccess={(updatedCategory) => {
          if (editingCategory) {
            setCategories(categories.map(c => c.id === updatedCategory.id ? updatedCategory : c));
          } else {
            setCategories([...categories, updatedCategory]);
          }
          setIsCategoryModalOpen(false);
        }}
      />

      <ItemModal 
        isOpen={isItemModalOpen} 
        onClose={() => setIsItemModalOpen(false)} 
        categoryId={activeCategoryId}
        item={editingItem}
        currency={currency}
        onSuccess={(updatedItem) => {
          setCategories(categories.map(c => {
            if (c.id === updatedItem.category_id) {
              if (editingItem) {
                return { ...c, items: c.items.map(i => i.id === updatedItem.id ? updatedItem : i) };
              } else {
                return { ...c, items: [...(c.items || []), updatedItem] };
              }
            }
            return c;
          }));
          setIsItemModalOpen(false);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------
// Sub-components for Modals
// ---------------------------------------------------------

function CategoryModal({ isOpen, onClose, category, onSuccess }) {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName(category ? category.name : '');
      setImage(null);
      setPreview(category && category.image_url ? getImageUrl(category.image_url) : null);
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    if (image) formData.append('image', image);

    try {
      const url = category ? `/api/tenant/menu/categories/${category.id}` : '/api/tenant/menu/categories';
      // If PUT, Laravel requires _method=PUT in POST request for form-data
      if (category) {
        formData.append('_method', 'PUT');
      }
      const res = await fetchWithAuth(url, {
        method: 'POST', // always POST for multipart/form-data in Laravel
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to save category');
      }
      
      onSuccess(data);
    } catch (error) {
      toast.error(error.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{category ? 'Edit Category' : 'Add Category'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Starters, Main Course"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category Image (Optional)</label>
            <div 
              className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${preview ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-sm">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">Change</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm mb-3">
                    <Upload size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Click to upload image</span>
                  <span className="text-xs font-medium text-slate-400 mt-1">PNG, JPG up to 2MB</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {category ? 'Save Changes' : 'Create Category'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ItemModal({ isOpen, onClose, categoryId, item, onSuccess, currency }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [portions, setPortions] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName(item ? item.name : '');
      setDescription(item && item.description ? item.description : '');
      setPrice(item ? item.price : '');
      setPortions(item && Array.isArray(item.portions) ? item.portions : []);
      setModifiers(item && Array.isArray(item.modifiers) ? item.modifiers : []);
      setImage(null);
      setPreview(item && item.image_url ? getImageUrl(item.image_url) : null);
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPortion = () => setPortions([...portions, { name: '', price: '' }]);
  const updatePortion = (index, field, value) => {
    const newPortions = [...portions];
    newPortions[index][field] = value;
    setPortions(newPortions);
  };
  const removePortion = (index) => setPortions(portions.filter((_, i) => i !== index));

  const addModifierGroup = () => setModifiers([...modifiers, { name: 'Extras', options: [{ name: '', price: '' }] }]);
  const updateModifierGroup = (index, field, value) => {
    const newMods = [...modifiers];
    newMods[index][field] = value;
    setModifiers(newMods);
  };
  const removeModifierGroup = (index) => setModifiers(modifiers.filter((_, i) => i !== index));

  const addModifierOption = (groupIndex) => {
    const newMods = [...modifiers];
    if (!newMods[groupIndex].options) newMods[groupIndex].options = [];
    newMods[groupIndex].options.push({ name: '', price: '' });
    setModifiers(newMods);
  };
  const updateModifierOption = (groupIndex, optionIndex, field, value) => {
    const newMods = [...modifiers];
    newMods[groupIndex].options[optionIndex][field] = value;
    setModifiers(newMods);
  };
  const removeModifierOption = (groupIndex, optionIndex) => {
    const newMods = [...modifiers];
    newMods[groupIndex].options = newMods[groupIndex].options.filter((_, i) => i !== optionIndex);
    setModifiers(newMods);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || (portions.length === 0 && !price)) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('category_id', categoryId);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', portions.length > 0 ? 0 : price);
    if (portions.length > 0) {
      formData.append('portions', JSON.stringify(portions));
    }
    if (modifiers.length > 0) {
      formData.append('modifiers', JSON.stringify(modifiers));
    }
    if (image) formData.append('image', image);

    try {
      const url = item ? `/api/tenant/menu/items/${item.id}` : '/api/tenant/menu/items';
      if (item) {
        formData.append('_method', 'PUT');
      }
      const res = await fetchWithAuth(url, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to save item');
      }
      
      onSuccess(data);
    } catch (error) {
      toast.error(error.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{item ? 'Edit Item' : 'Add New Item'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          
          <div className="flex gap-4">
            {/* Image Upload Box */}
            <div className="shrink-0">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Photo</label>
              <div 
                className={`w-24 h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${preview ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <ImageIcon size={16} className="text-white" />
                    </div>
                  </>
                ) : (
                  <ImageIcon size={24} className="text-slate-400" />
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Item Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Classic Burger"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  required
                />
              </div>
              
              {portions.length === 0 && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Base Price ({currency})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Portions (Optional)</label>
              <button type="button" onClick={addPortion} className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                <Plus size={14} /> Add Portion
              </button>
            </div>
            
            {portions.length > 0 ? (
              <div className="space-y-3">
                {portions.map((portion, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input 
                      type="text"
                      placeholder="e.g. Large"
                      value={portion.name}
                      onChange={e => updatePortion(idx, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-orange-500"
                      required
                    />
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={portion.price}
                      onChange={e => updatePortion(idx, 'price', e.target.value)}
                      className="w-24 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-orange-500"
                      required
                    />
                    <button type="button" onClick={() => removePortion(idx)} className="text-slate-400 hover:text-red-500 p-1">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">Add portions like Small, Medium, Large if this item has multiple sizes.</p>
            )}
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Extras / Add-ons (Optional)</label>
              <button type="button" onClick={addModifierGroup} className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                <Plus size={14} /> Add Group
              </button>
            </div>
            
            {modifiers.length > 0 ? (
              <div className="space-y-4">
                {modifiers.map((group, gIdx) => (
                  <div key={gIdx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <input 
                        type="text"
                        placeholder="Group Name (e.g. Add-ons)"
                        value={group.name}
                        onChange={e => updateModifierGroup(gIdx, 'name', e.target.value)}
                        className="text-sm font-bold px-2 py-1 outline-none border-b border-transparent focus:border-orange-500 bg-transparent w-full text-slate-800 dark:text-slate-100"
                        required
                      />
                      <button type="button" onClick={() => removeModifierGroup(gIdx)} className="text-slate-400 hover:text-red-500 p-1 ml-2">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="space-y-2 pl-2 border-l-2 border-slate-100 dark:border-slate-800">
                      {group.options?.map((option, oIdx) => (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <input 
                            type="text"
                            placeholder="Option Name (e.g. Cheese)"
                            value={option.name}
                            onChange={e => updateModifierOption(gIdx, oIdx, 'name', e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-orange-500"
                            required
                          />
                          <input 
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={option.price}
                            onChange={e => updateModifierOption(gIdx, oIdx, 'price', e.target.value)}
                            className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-orange-500"
                            required
                          />
                          <button type="button" onClick={() => removeModifierOption(gIdx, oIdx)} className="text-slate-400 hover:text-red-500 p-1">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addModifierOption(gIdx)} className="text-xs font-bold text-slate-500 hover:text-orange-500 flex items-center gap-1 mt-2">
                        <Plus size={12} /> Add Option
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">Add extras like Cheese, Sauce, etc. that customers can select.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description (Optional)</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Served with a side of crispy fries and our signature sauce."
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium resize-none"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md flex items-center justify-center gap-2 mt-4">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {item ? 'Save Changes' : 'Add Item'}
          </button>
        </form>
      </div>
    </div>
  );
}
