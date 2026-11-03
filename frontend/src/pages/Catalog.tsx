import { useState, useEffect } from 'react';
import { PackageSearch, MapPin, Search, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import PageWrapper from '../components/PageWrapper';
import EmptyState from '../components/EmptyState';
import { Product, Warehouse } from '../types';
import { FALLBACK_PRODUCTS, FALLBACK_WAREHOUSES } from '../lib/fallbackData';
import { toast, Toaster } from 'sonner';

export default function Catalog() {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedNode, setSelectedNode] = useState<Warehouse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // CRUD Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCatalogData = async () => {
    try {
      const [prodData, whData] = await Promise.all([
        api.get('/api/v1/products'),
        api.get('/api/v1/warehouses')
      ]);
      setCatalog(prodData?.data?.length ? prodData.data : (FALLBACK_PRODUCTS as unknown as Product[]));
      setWarehouses(whData?.data?.length ? whData.data : (FALLBACK_WAREHOUSES as unknown as Warehouse[]));
      setLoading(false);
    } catch (err) {
      console.warn('Network offline or backend spinning up, using cached catalog:', err);
      setCatalog(FALLBACK_PRODUCTS as unknown as Product[]);
      setWarehouses(FALLBACK_WAREHOUSES as unknown as Warehouse[]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.name || !formData.price) {
      toast.error('Validation Error', { description: 'SKU, name, and base cost are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/api/v1/products', {
        sku: formData.sku.toUpperCase().trim(),
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim()
      });

      if (res.status === 'success') {
        toast.success('Product Created', { description: `SKU ${formData.sku.toUpperCase()} registered in catalog.` });
        setIsAddOpen(false);
        setFormData({ sku: '', name: '', price: '', description: '' });
        fetchCatalogData();
      } else {
        throw new Error(res.message || 'Creation failed');
      }
    } catch (error: any) {
      toast.error('Failed to Register Product', { description: error.message || 'Server error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmitting(true);
    try {
      const res = await api.patch(`/api/v1/products/${editingProduct.id}`, {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        sku: formData.sku.toUpperCase().trim()
      });

      if (res.status === 'success') {
        toast.success('Product Updated', { description: `${formData.name} updated successfully.` });
        setEditingProduct(null);
        setFormData({ sku: '', name: '', price: '', description: '' });
        fetchCatalogData();
      } else {
        throw new Error(res.message || 'Update failed');
      }
    } catch (error: any) {
      toast.error('Update Failed', { description: error.message || 'Could not update product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/api/v1/products/${deletingProduct.id}`);
      if (res.status === 'success') {
        toast.success('Product Removed', { description: `Product ${deletingProduct.sku} decommissioned.` });
        setDeletingProduct(null);
        fetchCatalogData();
      } else {
        throw new Error(res.message || 'Deletion failed');
      }
    } catch (error: any) {
      toast.error('Deletion Failed', { description: error.message || 'Could not delete product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      price: String(p.price),
      description: p.description || ''
    });
  };

  // Filter based on search query
  const filteredCatalog = catalog.filter(p =>
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageWrapper>
      <Toaster position="bottom-right" richColors />
      <div className="w-full min-h-full flex flex-col space-y-6 font-sans pb-12">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#E5E5EA] pb-5 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight font-display">Master Catalog</h1>
            <p className="text-[#86868B] mt-1 text-xs sm:text-sm font-medium">Global SKU registry, base cost configurations, and regional stock allocations.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#86868B]" />
              <input
                type="text"
                placeholder="Search SKU or Name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] outline-none text-xs font-medium bg-white"
              />
            </div>
            <button
              onClick={() => {
                setFormData({ sku: '', name: '', price: '', description: '' });
                setIsAddOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 min-w-0">
          {/* Left Sidebar: Regional Node Switcher */}
          <div className="lg:col-span-1 space-y-2 min-w-0">
            <h3 className="text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2 px-1 font-display">Logistics Hub Scope</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <button
                onClick={() => setSelectedNode(null)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between ${
                  !selectedNode
                    ? 'bg-[#1D1D1F] text-white border-black shadow-xs'
                    : 'bg-white border-[#E5E5EA] text-[#1D1D1F] hover:border-[#D2D2D7] hover:bg-white/80'
                }`}
              >
                <div className="flex items-center min-w-0">
                  <PackageSearch className="w-4 h-4 mr-2.5 shrink-0" />
                  <span className="text-xs font-bold truncate">Global Master List</span>
                </div>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded shrink-0 ${!selectedNode ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {catalog.length}
                </span>
              </button>

              {warehouses.map(wh => {
                const isSelected = selectedNode?.id === wh.id;
                const uniqueCount = wh.inventory?.length || 0;
                return (
                  <button
                    key={wh.id}
                    onClick={() => setSelectedNode(wh)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all flex flex-col min-w-0 ${
                      isSelected
                        ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-xs'
                        : 'bg-white border-[#E5E5EA] text-[#1D1D1F] hover:border-[#D2D2D7] hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <div className="flex items-center min-w-0">
                        <MapPin className="w-3.5 h-3.5 mr-2 shrink-0" />
                        <span className="text-xs font-bold truncate">{wh.name}</span>
                      </div>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#1D1D1F]'
                      }`}>
                        {wh.code}
                      </span>
                    </div>
                    <span className={`text-[10px] mt-0.5 ml-5.5 truncate ${isSelected ? 'text-white/80' : 'text-[#86868B]'}`}>
                      {wh.location} • {uniqueCount} SKUs
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Data Table with Full CRUD & Liquid Glass Container */}
          <div className="lg:col-span-3 liquid-glass rounded-2xl md:rounded-[22px] overflow-hidden flex flex-col min-w-0 max-w-full">
            <div className="p-4 sm:p-5 border-b border-[#E5E5EA] bg-white/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#1D1D1F] font-display">
                  {selectedNode ? `Regional Inventory: ${selectedNode.name}` : 'Global Master Catalog'}
                </h3>
                <p className="text-[11px] text-[#86868B]">
                  {selectedNode ? `Filtered to node ${selectedNode.code}` : `Showing ${filteredCatalog.length} active registered SKUs`}
                </p>
              </div>
              {selectedNode && (
                <span className="px-3 py-1 bg-white text-[#1D1D1F] text-xs font-bold rounded-xl shadow-2xs border border-[#E5E5EA]">
                  Allocated: {selectedNode.inventory?.reduce((a, i) => a + i.quantity, 0) || 0} units
                </span>
              )}
            </div>

            <div className="overflow-x-auto flex-1 w-full">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead className="bg-[#F5F5F7]/80 border-b border-[#E5E5EA]">
                  <tr>
                    <th className="py-3 px-4 sm:px-5 text-[11px] font-bold text-[#86868B] uppercase">SKU</th>
                    <th className="py-3 px-4 sm:px-5 text-[11px] font-bold text-[#86868B] uppercase">Product Name</th>
                    <th className="py-3 px-4 sm:px-5 text-[11px] font-bold text-[#86868B] uppercase">Base Cost</th>
                    {selectedNode && <th className="py-3 px-4 sm:px-5 text-[11px] font-bold text-[#86868B] uppercase">Local Stock</th>}
                    <th className="py-3 px-4 sm:px-5 text-[11px] font-bold text-[#86868B] uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA] text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#86868B]">
                        Loading master catalog...
                      </td>
                    </tr>
                  ) : filteredCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState
                          icon={<PackageSearch className="w-7 h-7" />}
                          title="No products found"
                          subtitle={searchQuery ? `No SKUs match "${searchQuery}"` : 'Your catalog has no registered products.'}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredCatalog.map(p => {
                      const localItem = selectedNode?.inventory?.find(i => i.productId === p.id);
                      return (
                        <tr key={p.id} className="hover:bg-black/[0.02] transition-colors group">
                          <td className="py-3.5 px-5 font-mono font-bold text-[#0071E3] whitespace-nowrap">{p.sku}</td>
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-[#1D1D1F]">{p.name}</div>
                            {p.description && (
                              <div className="text-[10px] text-[#86868B] truncate max-w-xs">{p.description}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-[#1D1D1F] font-mono whitespace-nowrap">
                            ${Number(p.price).toFixed(2)}
                          </td>
                          {selectedNode && (
                            <td className="py-3.5 px-5 font-bold font-mono whitespace-nowrap">
                              {localItem ? (
                                <span className={localItem.quantity <= 5 ? 'text-rose-600' : 'text-[#1D1D1F]'}>
                                  {localItem.quantity} units
                                </span>
                              ) : (
                                <span className="text-gray-400">0 units</span>
                              )}
                            </td>
                          )}
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5 opacity-90 group-hover:opacity-100">
                              <button
                                onClick={() => openEditModal(p)}
                                title="Edit Product"
                                className="p-1.5 rounded-lg border border-[#E5E5EA] hover:border-[#D2D2D7] hover:bg-white text-[#1D1D1F] transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingProduct(p)}
                                title="Delete Product"
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE PRODUCT MODAL */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl md:rounded-[22px] w-full max-w-md shadow-2xl border border-[#E5E5EA] overflow-hidden"
            >
              <div className="p-5 border-b border-[#E5E5EA] flex items-center justify-between bg-[#F5F5F7]">
                <h3 className="text-sm font-bold text-[#1D1D1F] font-display">Add Product to Catalog</h3>
                <button onClick={() => setIsAddOpen(false)} className="text-[#86868B] hover:text-black">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">SKU Barcode</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. APPL-MBP-14"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Apple MacBook Pro 14"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Base Cost ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1999.00"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Hardware specifications or category details..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-bold hover:bg-[#F5F5F7] hover:border-[#D2D2D7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Create SKU'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT PRODUCT MODAL */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl md:rounded-[22px] w-full max-w-md shadow-2xl border border-[#E5E5EA] overflow-hidden"
            >
              <div className="p-5 border-b border-[#E5E5EA] flex items-center justify-between bg-[#F5F5F7]">
                <h3 className="text-sm font-bold text-[#1D1D1F] font-display">Edit Product: {editingProduct.sku}</h3>
                <button onClick={() => setEditingProduct(null)} className="text-[#86868B] hover:text-black">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">SKU Barcode</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Base Cost ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="w-1/2 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-bold hover:bg-[#F5F5F7] hover:border-[#D2D2D7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deletingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl md:rounded-[22px] w-full max-w-sm shadow-2xl border border-rose-200 p-6 space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F] font-display">Decommission Product?</h3>
                <p className="text-xs text-[#86868B] mt-1 leading-relaxed">
                  Are you sure you want to remove <span className="font-bold text-[#1D1D1F]">{deletingProduct.name}</span> ({deletingProduct.sku})? This will delete all associated inventory balances across all hubs.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingProduct(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-[#D2D2D7] text-xs font-bold hover:bg-[#F5F5F7]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Removing...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
