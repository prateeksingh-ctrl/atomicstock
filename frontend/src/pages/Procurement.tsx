import { useState, useEffect } from 'react';
import { DownloadCloud, AlertCircle, CheckCircle2, Plus, Search, Lock, Unlock } from 'lucide-react';
import { api } from '../lib/api';
import AnimatedButton from '../components/AnimatedButton';
import PageWrapper from '../components/PageWrapper';
import HardwareInputBar, { HardwareSource } from '../components/HardwareInputBar';
import { Warehouse, Supplier, Product } from '../types';

export default function Procurement() {
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [hardwareSource, setHardwareSource] = useState<HardwareSource>('usb');
  const [rxDate, setRxDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const [warehouseId, setWarehouseId] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [catalog, setCatalog] = useState<Product[]>([]);
  const [, setScannedProduct] = useState<Product | null>(null);

  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', code: '', contact: '' });

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/warehouses'),
      api.get('/api/v1/suppliers'),
      api.get('/api/v1/products')
    ]).then(([whData, supData, prodData]) => {
      setWarehouses(whData.data || []);
      if (whData.data?.length > 0) setWarehouseId(whData.data[0].id);
      setSuppliers(supData.data || []);
      setCatalog(prodData.data || []);
    }).catch(err => console.error('Initialization error', err));
  }, []);

  useEffect(() => {
    if (sku.length >= 2) {
      const found = catalog.find(p => p.sku.toUpperCase() === sku.toUpperCase());
      setScannedProduct(found || null);
    } else {
      setScannedProduct(null);
    }
  }, [sku, catalog]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.post('/api/v1/suppliers', { ...newSupplier, warehouseId });
      if (data.status === 'success') {
        setSuppliers(prev => [...prev, data.data]);
        setSupplierId(data.data.id);
        setShowAddSupplier(false);
        setNewSupplier({ name: '', code: '', contact: '' });
        setStatus({ type: 'success', message: 'New vendor registered successfully.' });
      } else {
        throw new Error(data.message || 'Failed to register supplier');
      }
    } catch {
      setStatus({ type: 'error', message: 'Failed to register supplier.' });
    }
  };

  const handleIngestion = async (e: React.FormEvent) => {
    e.preventDefault();

    // BUG-08 FIX: Guard against empty supplier selection
    if (!supplierId) {
      setStatus({ type: 'error', message: 'Please select or register an authorized vendor before committing.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Executing atomic ingestion...' });

    try {
      const data = await api.post('/api/v1/inventory/receive', {
        sku: sku.toUpperCase(),
        warehouseId,
        quantity: Number(quantity),
        supplierId,
        receiveDate: new Date(rxDate).toISOString()
      });

      if (data.status === 'error') throw new Error(data.message);

      setStatus({ type: 'success', message: `Batch committed: ${quantity} units of ${sku.toUpperCase()} ingested.` });
      setSku('');
      setQuantity('');
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 4000);
    } catch (error: any) {
      const cleanMessage = error.message?.includes('Foreign key')
        ? 'Data Integrity Error: Ensure a valid Hub and Supplier are selected.'
        : error.message || 'Ingestion failed';
      setStatus({ type: 'error', message: cleanMessage });
    }
  };

  return (
    <PageWrapper>
      <div className="w-full max-w-5xl mx-auto font-sans pb-12 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight font-display">Inbound Receiving</h1>
            <p className="text-[#86868B] mt-1 text-xs sm:text-sm font-medium">Verify supplier delivery manifests and record incoming inventory.</p>
          </div>
          <div className="flex gap-2.5 items-end flex-wrap sm:flex-nowrap">
            <div className="w-36 sm:w-40">
              <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Time of Receipt</label>
              <input
                type="datetime-local"
                value={rxDate}
                onChange={e => setRxDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-[#E5E5EA] text-xs font-bold bg-white shadow-sm outline-none focus:border-[#0071E3]"
              />
            </div>
            <div className="w-36 sm:w-40">
              <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Receiving Warehouse</label>
              <select
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-[#E5E5EA] text-xs font-bold bg-white shadow-sm outline-none focus:border-[#0071E3]"
              >
                {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.code} - {wh.location}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Hardware Input Selector */}
        <HardwareInputBar
          activeSource={hardwareSource}
          onSourceChange={setHardwareSource}
          onBarcodeDetected={(code) => setSku(code)}
        />

        <div className="liquid-glass rounded-2xl md:rounded-[22px] p-4 sm:p-7 md:p-8 min-w-0 max-w-full">
          {status.type === 'error' && (
            <div className="mb-6 p-4 bg-rose-50/80 backdrop-blur-md border border-rose-200 rounded-xl flex items-start text-rose-700">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{status.message}</p>
            </div>
          )}
          {status.type === 'success' && (
            <div className="mb-6 p-4 bg-emerald-50/80 backdrop-blur-md border border-emerald-200 rounded-xl flex items-start text-emerald-700">
              <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{status.message}</p>
            </div>
          )}

          {showAddSupplier ? (
            <form onSubmit={handleAddSupplier} className="mb-8 p-4 sm:p-5 bg-white/70 backdrop-blur-md rounded-xl border border-[#E5E5EA] relative">
              <button
                type="button"
                onClick={() => setShowAddSupplier(false)}
                className="absolute top-4 right-4 text-xs font-bold text-[#86868B] hover:text-black"
              >
                Cancel
              </button>
              <h3 className="text-sm font-bold text-[#1D1D1F] mb-4 font-display">Register New Local Vendor</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Vendor Name"
                  required
                  value={newSupplier.name}
                  onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] bg-white outline-none text-sm focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3]"
                />
                <input
                  type="text"
                  placeholder="Vendor Code (e.g., VND-01)"
                  required
                  value={newSupplier.code}
                  onChange={e => setNewSupplier({ ...newSupplier, code: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] bg-white outline-none text-sm focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3]"
                />
              </div>
              <input
                type="text"
                placeholder="Contact Info"
                required
                value={newSupplier.contact}
                onChange={e => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] bg-white outline-none text-sm mb-4 focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3]"
              />
              <AnimatedButton type="submit" variant="primary" className="px-4 py-2 text-xs">
                Save Vendor
              </AnimatedButton>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3 min-w-0">
              <div className="w-full sm:w-2/3 min-w-0">
                <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Authorized Vendor / Supplier</label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] bg-white outline-none text-sm font-medium focus:border-[#0071E3]"
                >
                  <option value="" disabled>Select authorized vendor...</option>
                  {suppliers.filter(s => s.warehouseId === warehouseId).map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name} ({sup.code})</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSupplier(true)}
                className="sm:ml-4 sm:mt-6 text-[#0071E3] text-sm font-bold flex items-center hover:underline self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 mr-1" /> New Vendor
              </button>
            </div>
          )}

          <form onSubmit={handleIngestion} className="space-y-6 border-t border-[#E5E5EA] pt-6 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 min-w-0">
              <div className="sm:col-span-2 relative min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider">Item SKU / Barcode</label>
                  <span className="text-[10px] font-bold text-[#86868B] flex items-center">
                    {hardwareSource === 'manual' ? (
                      <span className="text-amber-600 flex items-center"><Unlock className="w-3 h-3 mr-1" /> Keypad Unlocked</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setHardwareSource('manual')}
                        className="text-[#0071E3] hover:underline flex items-center"
                      >
                        <Lock className="w-3 h-3 mr-1" /> Hardware Bound (Click to unlock typing)
                      </button>
                    )}
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#86868B]" />
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value.toUpperCase())}
                    required
                    placeholder={hardwareSource === 'manual' ? "Type or scan SKU..." : "Waiting for hardware scanner..."}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E5E5EA] focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3] outline-none text-sm font-bold font-mono uppercase bg-white"
                  />
                </div>
              </div>
              <div className="sm:col-span-1 min-w-0">
                <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Ingestion Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3] outline-none text-sm font-bold bg-white"
                />
              </div>
            </div>

            <AnimatedButton
              type="submit"
              loading={status.type === 'loading'}
              disabled={status.type === 'loading' || !sku}
              variant="primary"
              icon={<DownloadCloud className="w-5 h-5" />}
              className="w-full py-4"
            >
              Commit Inbound Batch
            </AnimatedButton>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
