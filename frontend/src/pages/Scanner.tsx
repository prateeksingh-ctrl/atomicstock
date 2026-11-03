import { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, History, ShoppingCart, TrendingUp, TrendingDown, Volume2, Sparkles, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import EmptyState from '../components/EmptyState';
import AnimatedButton from '../components/AnimatedButton';
import PageWrapper from '../components/PageWrapper';
import HardwareInputBar, { HardwareSource } from '../components/HardwareInputBar';
import { Warehouse, Product } from '../types';
import { FALLBACK_WAREHOUSES, FALLBACK_PRODUCTS } from '../lib/fallbackData';

/**
 * Web Audio API synthesizer for hardware POS acoustic feedback.
 * Provides instant tactile auditory feedback without external audio asset downloads.
 */
function playAcousticFeedback(type: 'scan' | 'success' | 'error') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'scan') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 tone
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.07); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.1); // E3
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch {
    // Graceful fallback if autoplay policy or browser audio restrictions apply
  }
}

interface ScanLog {
  id: string;
  sku: string;
  time: string;
  status: 'success' | 'error';
  message: string;
}

export default function Scanner() {
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [hardwareSource, setHardwareSource] = useState<HardwareSource>('usb');

  const [txDate, setTxDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const skuInputRef = useRef<HTMLInputElement>(null);

  const [warehouseId, setWarehouseId] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/warehouses').catch(() => ({ data: FALLBACK_WAREHOUSES })),
      api.get('/api/v1/products').catch(() => ({ data: FALLBACK_PRODUCTS }))
    ]).then(([whData, prodData]) => {
      const whs = whData?.data?.length ? whData.data : (FALLBACK_WAREHOUSES as unknown as Warehouse[]);
      const prods = prodData?.data?.length ? prodData.data : (FALLBACK_PRODUCTS as unknown as Product[]);
      setWarehouses(whs);
      if (whs.length > 0) setWarehouseId(whs[0].id);
      setCatalog(prods);
    });
  }, []);

  useEffect(() => {
    if (sku.length >= 2) {
      const found = catalog.find(p => p.sku.toLowerCase() === sku.toLowerCase());
      setScannedProduct(found || null);
      if (found) {
        if (audioFeedback) playAcousticFeedback('scan');
        setSellingPrice(Number((Number(found.price) * 1.3).toFixed(2)));
      } else {
        setSellingPrice('');
      }
    } else {
      setScannedProduct(null);
      setSellingPrice('');
    }
  }, [sku, catalog, audioFeedback]);

  const addLog = (scannedSku: string, status: 'success' | 'error', message: string) => {
    setLogs(prev => [
      { id: Math.random().toString(36).slice(2), sku: scannedSku, time: new Date().toLocaleTimeString(), status, message },
      ...prev
    ].slice(0, 10));
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !scannedProduct) return;

    setIsProcessing(true);
    const attemptSku = sku.trim();

    try {
      const data = await api.post('/api/v1/inventory/dispatch', {
        sku: attemptSku,
        warehouseId,
        quantity: Number(quantity),
        sellingPrice: Number(sellingPrice),
        transactionDate: new Date(txDate).toISOString()
      });

      if (data.status === 'error') throw new Error(data.message);

      if (audioFeedback) playAcousticFeedback('success');
      const margin = (Number(sellingPrice) - Number(scannedProduct.price)) * Number(quantity);
      const marginText = margin >= 0 ? `+$${margin.toFixed(2)} Profit` : `-$${Math.abs(margin).toFixed(2)} Loss`;
      addLog(attemptSku, 'success', `Sold ${quantity} units at $${sellingPrice}. Margin: ${marginText}`);
    } catch (error: any) {
      if (audioFeedback) playAcousticFeedback('error');
      const cleanError = error.message?.includes('Stock entry not found')
        ? 'Zero inventory available at this hub.'
        : error.message || 'Dispatch failed';
      addLog(attemptSku, 'error', cleanError);
    } finally {
      setSku('');
      setQuantity(1);
      setIsProcessing(false);
      skuInputRef.current?.focus();
    }
  };

  const baseCost = scannedProduct ? Number(scannedProduct.price) : 0;
  const currentSelling = Number(sellingPrice) || 0;
  const unitProfit = currentSelling - baseCost;
  const totalProfit = unitProfit * (Number(quantity) || 1);
  const isLoss = unitProfit < 0;

  return (
    <PageWrapper>
      <div className="w-full max-w-6xl mx-auto font-sans grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight font-display">Outbound Dispatch</h1>
              <p className="text-[#86868B] mt-1 text-xs sm:text-sm">Floor POS terminal with automatic margin calculation.</p>
            </div>
            <div className="flex gap-2.5 items-end flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setAudioFeedback(!audioFeedback)}
                title="Toggle Acoustic Feedback"
                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                  audioFeedback
                    ? 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/30'
                    : 'bg-white text-gray-400 border-[#E5E5EA]'
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <div className="w-36 sm:w-40">
                <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Time of Sale</label>
                <input
                  type="datetime-local"
                  value={txDate}
                  onChange={e => setTxDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#E5E5EA] text-xs font-bold bg-white shadow-sm outline-none focus:border-[#0071E3]"
                />
              </div>
              <div className="w-36 sm:w-40">
                <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Warehouse Hub</label>
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

          {/* Hardware Integration Selector */}
          <HardwareInputBar
            activeSource={hardwareSource}
            onSourceChange={setHardwareSource}
            onBarcodeDetected={(code) => {
              setSku(code);
              playAcousticFeedback('scan');
            }}
          />

          <div className="liquid-glass rounded-2xl md:rounded-[22px] p-4 sm:p-6 lg:p-7 min-w-0 max-w-full">
            <form onSubmit={handleDispatch} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 min-w-0">
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
                  <input
                    ref={skuInputRef}
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    required
                    disabled={isProcessing}
                    placeholder={hardwareSource === 'manual' ? "Type SKU..." : "Waiting for scanner input (or click Unlock)..."}
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 outline-none text-sm font-bold font-mono transition-all bg-white"
                  />
                  {/* Quick-test SKU pills for presentation/evaluation convenience */}
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider flex items-center mr-1">
                      <Sparkles className="w-3 h-3 mr-1 text-[#0071E3]" /> Quick Test:
                    </span>
                    {catalog.slice(0, 5).map(prod => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => setSku(prod.sku)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                          sku.toUpperCase() === prod.sku.toUpperCase()
                            ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                            : 'bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5EA] hover:border-[#D2D2D7] hover:bg-white'
                        }`}
                      >
                        {prod.sku}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-1 min-w-0">
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value ? Number(e.target.value) : '')}
                    required
                    disabled={isProcessing}
                    className="w-full px-3.5 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 outline-none text-sm font-bold font-mono bg-white"
                  />
                </div>
              </div>

              {/* Dynamic Glassmorphic Financial Panel */}
              <motion.div
                layout
                className={`rounded-xl sm:rounded-2xl border p-4 sm:p-5 transition-all duration-300 min-w-0 max-w-full ${
                  scannedProduct
                    ? isLoss
                      ? 'bg-rose-50/80 backdrop-blur-md border-rose-200'
                      : 'bg-emerald-50/80 backdrop-blur-md border-emerald-200'
                    : 'bg-white/60 backdrop-blur-md border-[#E5E5EA]'
                }`}
              >
                <div className="pb-3 border-b border-[#E5E5EA]/80 mb-3 min-w-0">
                  <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-0.5 truncate">Product Identity</p>
                  <motion.p
                    key={scannedProduct?.id || 'empty'}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-sm sm:text-base font-bold truncate ${scannedProduct ? 'text-[#1D1D1F]' : 'text-gray-400'}`}
                  >
                    {scannedProduct ? scannedProduct.name : 'Waiting for valid item...'}
                  </motion.p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end min-w-0">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1 truncate">Supplier Cost</p>
                    <p className={`text-sm font-semibold tabular-nums font-mono truncate ${scannedProduct ? 'text-[#86868B]' : 'text-gray-300'}`}>
                      {scannedProduct ? `$${baseCost.toFixed(2)}` : '--'}
                    </p>
                  </div>
                  <div className="relative min-w-0">
                    <p className="text-[10px] font-bold text-[#0071E3] uppercase tracking-wider mb-1 truncate">Selling Price</p>
                    <span className="absolute left-3 top-[26px] text-sm font-bold text-gray-400 font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={sellingPrice}
                      onChange={e => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                      disabled={!scannedProduct}
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-[#0071E3]/30 bg-white focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] outline-none text-sm font-bold font-mono text-[#0071E3] disabled:opacity-40"
                    />
                  </div>
                  <div className="flex sm:flex-col sm:items-end justify-between items-center min-w-0">
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1 truncate">Net Margin</p>
                    <AnimatePresence mode="wait">
                      {scannedProduct ? (
                        <motion.div
                          key={isLoss ? 'loss' : 'profit'}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          className={`flex items-center text-sm font-bold font-mono truncate ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}
                        >
                          {isLoss ? <TrendingDown className="w-4 h-4 mr-1 shrink-0" /> : <TrendingUp className="w-4 h-4 mr-1 shrink-0" />}
                          <span className="truncate">{isLoss ? '-' : '+'}${Math.abs(totalProfit).toFixed(2)}</span>
                        </motion.div>
                      ) : (
                        <p className="text-sm font-bold text-gray-400 font-mono">--</p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              <AnimatedButton
                type="submit"
                loading={isProcessing}
                disabled={isProcessing || !sku}
                variant="primary"
                icon={<ShoppingCart className="w-4 h-4" />}
                className="w-full py-3.5"
              >
                Complete Checkout
              </AnimatedButton>
            </form>
          </div>
        </div>

        {/* Live Ledger Panel */}
        <div className="liquid-glass rounded-2xl md:rounded-[22px] p-5 sm:p-6 h-full max-h-[600px] overflow-hidden flex flex-col min-w-0">
          <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider flex items-center mb-4 font-display">
            <History className="w-4 h-4 mr-2" /> Live Ledger
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {logs.length === 0 ? (
              <EmptyState
                icon={<History className="w-7 h-7" />}
                title="No transactions yet"
                subtitle="Scanned items will appear here in real time."
              />
            ) : (
              <AnimatePresence mode="popLayout">
                {logs.map(log => (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className={`p-4 rounded-xl border ${
                      log.status === 'success'
                        ? 'bg-white border-emerald-100 shadow-sm'
                        : 'bg-rose-50 border-rose-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-xs font-bold uppercase">{log.sku}</span>
                      <span className="text-[10px] font-semibold text-[#86868B]">{log.time}</span>
                    </div>
                    <div className="flex items-start">
                      {log.status === 'success'
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                        : <AlertCircle className="w-4 h-4 text-rose-500 mr-2 flex-shrink-0 mt-0.5" />}
                      <p className={`text-xs font-medium ${log.status === 'success' ? 'text-[#1D1D1F]' : 'text-rose-700'}`}>
                        {log.message}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
