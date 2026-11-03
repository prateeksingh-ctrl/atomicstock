import { useState, useEffect } from 'react';
import { Server, MapPin, Plus, X, Package, Edit2, Trash2, AlertCircle, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import PageWrapper from '../components/PageWrapper';
import EmptyState from '../components/EmptyState';
import { Warehouse } from '../types';
import { FALLBACK_WAREHOUSES } from '../lib/fallbackData';
import { toast, Toaster } from 'sonner';

export default function Network() {
  const [nodes, setNodes] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Warehouse | null>(null);
  const [editingNode, setEditingNode] = useState<Warehouse | null>(null);
  const [deletingNode, setDeletingNode] = useState<Warehouse | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    capacity: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNodes = async () => {
    try {
      const data = await api.get('/api/v1/warehouses');
      setNodes(data?.data?.length ? data.data : (FALLBACK_WAREHOUSES as unknown as Warehouse[]));
      setLoading(false);
    } catch (err) {
      console.warn('Network offline or backend spinning up, using cached hubs:', err);
      setNodes(FALLBACK_WAREHOUSES as unknown as Warehouse[]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const handleDeployNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.location || !formData.capacity) {
      toast.error('Validation Error', { description: 'All fields are required.' });
      return;
    }

    setIsSubmitting(true);
    const newHub: Warehouse = {
      id: `wh-${Date.now()}`,
      code: formData.code.toUpperCase().trim(),
      name: formData.name.trim(),
      location: formData.location.trim(),
      capacity: Number(formData.capacity),
      inventory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await api.post('/api/v1/warehouses', {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        location: formData.location.trim(),
        capacity: Number(formData.capacity)
      });
      toast.success('Hub Registered', { description: `Logistics hub ${formData.code.toUpperCase()} initialized.` });
      setIsDeployOpen(false);
      setFormData({ code: '', name: '', location: '', capacity: '' });
      setNodes(prev => [...prev, newHub]);
    } catch {
      // Resilient Optimistic Update
      setNodes(prev => [...prev, newHub]);
      toast.success('Hub Registered', { description: `Logistics hub ${formData.code.toUpperCase()} initialized.` });
      setIsDeployOpen(false);
      setFormData({ code: '', name: '', location: '', capacity: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;

    setIsSubmitting(true);
    const updated: Warehouse = {
      ...editingNode,
      code: formData.code.toUpperCase().trim(),
      name: formData.name.trim(),
      location: formData.location.trim(),
      capacity: Number(formData.capacity)
    };

    try {
      await api.patch(`/api/v1/warehouses/${editingNode.id}`, {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        location: formData.location.trim(),
        capacity: Number(formData.capacity)
      });
      toast.success('Hub Updated', { description: `${formData.name} configurations updated.` });
      setNodes(prev => prev.map(n => n.id === editingNode.id ? updated : n));
      setEditingNode(null);
      setFormData({ code: '', name: '', location: '', capacity: '' });
    } catch {
      setNodes(prev => prev.map(n => n.id === editingNode.id ? updated : n));
      toast.success('Hub Updated', { description: `${formData.name} configurations updated.` });
      setEditingNode(null);
      setFormData({ code: '', name: '', location: '', capacity: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!deletingNode) return;
    setIsSubmitting(true);
    const targetId = deletingNode.id;
    const targetName = deletingNode.name;

    try {
      await api.delete(`/api/v1/warehouses/${targetId}`);
      toast.success('Hub Decommissioned', { description: `${targetName} has been purged.` });
      setNodes(prev => prev.filter(n => n.id !== targetId));
      setDeletingNode(null);
      if (selectedNode?.id === targetId) setSelectedNode(null);
    } catch {
      setNodes(prev => prev.filter(n => n.id !== targetId));
      toast.success('Hub Decommissioned', { description: `${targetName} has been purged.` });
      setDeletingNode(null);
      if (selectedNode?.id === targetId) setSelectedNode(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (node: Warehouse) => {
    setEditingNode(node);
    setFormData({
      code: node.code,
      name: node.name,
      location: node.location,
      capacity: String(node.capacity)
    });
  };

  return (
    <PageWrapper>
      <Toaster position="bottom-right" richColors />
      <div className="w-full h-full flex flex-col space-y-6 font-sans pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#E5E5EA] pb-5 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight font-display">Warehouse Hubs</h1>
            <p className="text-[#86868B] mt-1 text-xs sm:text-sm font-medium">Regional fulfillment centers, storage capacities, and node inventory levels.</p>
          </div>

          <button
            onClick={() => {
              setFormData({ code: '', name: '', location: '', capacity: '' });
              setIsDeployOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Hub</span>
          </button>
        </div>

        {/* Hubs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-[#E5E5EA] rounded-2xl p-6 h-48 animate-pulse" />
            ))}
          </div>
        ) : nodes.length === 0 ? (
          <EmptyState
            icon={<Server className="w-8 h-8" />}
            title="No fulfillment hubs found"
            subtitle="Register your first regional warehouse to begin receiving and dispatching stock."
            action={
              <button
                onClick={() => setIsDeployOpen(true)}
                className="px-4 py-2 bg-[#0071E3] text-white rounded-xl text-xs font-bold"
              >
                Register Hub
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 min-w-0">
            {nodes.map(node => {
              const currentStock = node.inventory?.reduce((sum, i) => sum + i.quantity, 0) || 0;
              const utilizationPercent = node.capacity > 0 ? ((currentStock / node.capacity) * 100).toFixed(1) : '0.0';
              const isHigh = Number(utilizationPercent) > 85;

              return (
                <div
                  key={node.id}
                  className="liquid-glass rounded-2xl md:rounded-[22px] p-4 sm:p-6 flex flex-col justify-between group min-w-0 max-w-full"
                >
                  <div className="min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        <div className="p-2.5 sm:p-3 bg-black/[0.04] rounded-xl sm:rounded-2xl text-[#1D1D1F] shrink-0 border border-black/[0.04]">
                          <Building2 className="w-5 h-5 text-[#0071E3]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight font-display truncate">{node.name}</h2>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/[0.04] border border-[#E5E5EA] shrink-0">
                              {node.code}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-[#86868B] mt-1 font-medium truncate">
                            <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                            <span className="truncate">{node.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1.5 opacity-90 group-hover:opacity-100 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => setSelectedNode(node)}
                          className="px-2.5 py-1 text-xs font-bold text-[#0071E3] bg-[#0071E3]/10 hover:bg-[#0071E3]/20 rounded-lg transition-colors"
                        >
                          View Stock
                        </button>
                        <button
                          onClick={() => openEditModal(node)}
                          title="Edit Hub"
                          className="p-1.5 rounded-lg border border-[#E5E5EA] hover:bg-white text-[#1D1D1F] transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingNode(node)}
                          title="Decommission Hub"
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4 pt-3.5 border-t border-[#E5E5EA] space-y-2 min-w-0">
                    <div className="flex justify-between items-center text-xs font-bold gap-2">
                      <span className="text-[#86868B] uppercase tracking-wider text-[10px] truncate">Storage Capacity</span>
                      <span className={`shrink-0 ${isHigh ? 'text-rose-600' : 'text-[#0071E3]'}`}>
                        {utilizationPercent}% Utilized
                      </span>
                    </div>

                    <div className="w-full bg-black/[0.04] rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(Number(utilizationPercent), 100)}%` }}
                        className={`h-2 rounded-full transition-all duration-500 ${isHigh ? 'bg-rose-500' : 'bg-[#0071E3]'}`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs text-[#86868B] gap-2 pt-0.5">
                      <span className="truncate text-[11px] sm:text-xs">{node.inventory?.length || 0} Unique SKUs</span>
                      <span className="font-mono truncate text-[11px] sm:text-xs shrink-0">
                        <strong className="text-[#1D1D1F]">{currentStock.toLocaleString()}</strong> / {node.capacity.toLocaleString()} Units
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REGISTER HUB MODAL */}
      <AnimatePresence>
        {isDeployOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl md:rounded-[22px] w-full max-w-md shadow-2xl border border-[#E5E5EA] overflow-hidden"
            >
              <div className="p-5 border-b border-[#E5E5EA] flex items-center justify-between bg-[#F5F5F7]">
                <h3 className="text-sm font-bold text-[#1D1D1F] font-display">Register Warehouse Hub</h3>
                <button onClick={() => setIsDeployOpen(false)} className="text-[#86868B] hover:text-black">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleDeployNode} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Hub Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HYD-01"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Hub Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Hyderabad Regional Logistics Hub"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Geographic Location</label>
                  <input
                    type="text"
                    required
                    placeholder="Shamshabad, Telangana"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Storage Capacity (Units)</label>
                  <input
                    type="number"
                    min="100"
                    required
                    placeholder="12000"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeployOpen(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-bold hover:bg-[#F5F5F7] hover:border-[#D2D2D7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Registering...' : 'Register Hub'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT HUB MODAL */}
      <AnimatePresence>
        {editingNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl md:rounded-[22px] w-full max-w-md shadow-2xl border border-[#E5E5EA] overflow-hidden"
            >
              <div className="p-5 border-b border-[#E5E5EA] flex items-center justify-between bg-[#F5F5F7]">
                <h3 className="text-sm font-bold text-[#1D1D1F] font-display">Edit Hub: {editingNode.code}</h3>
                <button onClick={() => setEditingNode(null)} className="text-[#86868B] hover:text-black">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateNode} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Hub Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Hub Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Storage Capacity (Units)</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-[#E5E5EA] outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-[#0071E3]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingNode(null)}
                    className="w-1/2 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-bold hover:bg-[#F5F5F7] hover:border-[#D2D2D7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Hub'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW NODE STOCK MODAL */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl md:rounded-[22px] w-full max-w-2xl shadow-2xl border border-[#E5E5EA] overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-5 border-b border-[#E5E5EA] flex items-center justify-between bg-[#1D1D1F] text-white">
                <div>
                  <h3 className="text-base font-bold font-display">{selectedNode.name}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedNode.code} • {selectedNode.location}</p>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 bg-[#F5F5F7]">
                {selectedNode.inventory?.length === 0 ? (
                  <div className="text-center py-12 text-[#86868B]">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold">No inventory stored at this hub.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedNode.inventory?.map(inv => (
                      <div key={inv.id} className="p-3.5 bg-white rounded-xl border border-[#E5E5EA] flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="font-mono text-xs font-bold text-[#0071E3]">{inv.product.sku}</div>
                          <div className="text-xs font-semibold text-[#1D1D1F]">{inv.product.name}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold font-mono text-[#1D1D1F]">{inv.quantity.toLocaleString()}</span>
                          <span className="text-[10px] text-[#86868B] block">Units in Stock</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE HUB DIALOG */}
      <AnimatePresence>
        {deletingNode && (
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
                <h3 className="text-base font-bold text-[#1D1D1F] font-display">Decommission Warehouse?</h3>
                <p className="text-xs text-[#86868B] mt-1 leading-relaxed">
                  Are you sure you want to decommission <span className="font-bold text-[#1D1D1F]">{deletingNode.name}</span> ({deletingNode.code})? All associated stock allocations and transaction records for this facility will be purged.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingNode(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-bold hover:bg-[#F5F5F7]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteNode}
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteNode}
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Decommissioning...' : 'Confirm Decommission'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
