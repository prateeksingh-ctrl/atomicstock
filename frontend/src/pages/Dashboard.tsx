import { useState, useEffect, useCallback } from 'react';
import {
  PackageSearch, Server, Activity, DollarSign, Zap, ChevronRight,
  ArrowLeft, MapPin, Download, BarChart3, TrendingUp, AlertTriangle,
  PieChart as PieChartIcon, Award, Sparkles, Clock, ShieldAlert,
  ArrowUpRight, ArrowDownRight, RefreshCw, Layers
} from 'lucide-react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { api } from '../lib/api';
import KpiCard from '../components/KpiCard';
import EmptyState from '../components/EmptyState';
import PageWrapper from '../components/PageWrapper';
import { Warehouse } from '../types';

type DashboardTab = 'OVERVIEW' | 'PREDICTIVE_RESTOCK' | 'DEAD_STOCK' | 'AUDIT_LEDGER';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('OVERVIEW');
  const [stats, setStats] = useState({ totalProducts: 0, totalStock: 0, activeNodes: 0, totalValue: 0 });
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedNode, setSelectedNode] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Advanced Enterprise Feature State
  const [predictions, setPredictions] = useState<any[]>([]);
  const [inventoryHealth, setInventoryHealth] = useState<any | null>(null);
  const [auditTransactions, setAuditTransactions] = useState<any[]>([]);
  const [loadingAdvanced, setLoadingAdvanced] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [analyticsData, whData] = await Promise.all([
        api.get('/api/v1/analytics'),
        api.get('/api/v1/warehouses'),
      ]);
      setStats(analyticsData.data || { totalProducts: 0, totalStock: 0, activeNodes: 0, totalValue: 0 });
      setWarehouses(whData.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setLoading(false);
    }
  }, []);

  const fetchAdvancedMetrics = useCallback(async () => {
    setLoadingAdvanced(true);
    try {
      const [predData, healthData, txData] = await Promise.all([
        api.get('/api/v1/analytics/predictive-restock'),
        api.get('/api/v1/analytics/inventory-health'),
        api.get('/api/v1/transactions?limit=50')
      ]);
      setPredictions(predData.data || []);
      setInventoryHealth(healthData.data || null);
      setAuditTransactions(txData.data || []);
    } catch (err) {
      console.error('Failed to load advanced telemetry:', err);
    } finally {
      setLoadingAdvanced(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAdvancedMetrics();

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
    socket.on('inventory_updated', (event) => {
      setLastUpdate(`${new Date().toLocaleTimeString()} [${event.type}]`);
      setTimeout(() => setLastUpdate(null), 4500);
      fetchData();
      fetchAdvancedMetrics();
    });

    return () => { socket.disconnect(); };
  }, [fetchData, fetchAdvancedMetrics]);

  const calculatePnL = (value: number) => ({ cogs: value * 0.7, profit: value * 0.3 });
  const globalPnL = calculatePnL(stats.totalValue);

  const barChartData = warehouses.map(wh => {
    const stock = wh.inventory?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    return { name: wh.code, Stock: stock, Utilization: Math.min(Math.round((stock / wh.capacity) * 100), 100) };
  });

  const pieChartData = warehouses.map(wh => {
    const value = wh.inventory?.reduce((acc, item) => acc + (item.quantity * Number(item.product.price)), 0) || 0;
    return { name: wh.code, value };
  }).filter(d => d.value > 0);
  const pieColors = ['#0071E3', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];

  const criticalStock = warehouses.flatMap(wh =>
    wh.inventory?.filter(inv => inv.quantity > 0 && inv.quantity < 50).map(inv => ({
      ...inv, nodeName: wh.name, nodeCode: wh.code
    })) || []
  ).sort((a, b) => a.quantity - b.quantity).slice(0, 4);

  const assetMap = new Map<string, { sku: string; name: string; quantity: number; totalValue: number }>();
  warehouses.forEach(wh => {
    wh.inventory?.forEach(inv => {
      const sku = inv.product.sku;
      const val = inv.quantity * Number(inv.product.price);
      if (assetMap.has(sku)) {
        const existing = assetMap.get(sku)!;
        existing.quantity += inv.quantity;
        existing.totalValue += val;
      } else {
        assetMap.set(sku, { sku, name: inv.product.name, quantity: inv.quantity, totalValue: val });
      }
    });
  });
  const topAssets = Array.from(assetMap.values()).sort((a, b) => b.totalValue - a.totalValue).slice(0, 4);

  const downloadReport = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (!selectedNode) {
      csvContent += 'AtomicStock — Tier-1 Enterprise Network Telemetry & Audit Report\nGenerated: ' + dateStr + '\n\n';
      csvContent += 'Node Code,Node Name,Location,Max Capacity,Current Stock,Utilization %,Asset Valuation,Est COGS,Est Gross Margin\n';
      warehouses.forEach(wh => {
        const stock = wh.inventory?.reduce((acc, item) => acc + item.quantity, 0) || 0;
        const val = wh.inventory?.reduce((acc, item) => acc + (item.quantity * Number(item.product.price)), 0) || 0;
        const pnl = calculatePnL(val);
        const util = Math.round((stock / wh.capacity) * 100);
        csvContent += `${wh.code},"${wh.name}","${wh.location}",${wh.capacity},${stock},${util}%,$${val.toFixed(2)},$${pnl.cogs.toFixed(2)},$${pnl.profit.toFixed(2)}\n`;
      });
    } else {
      csvContent += `AtomicStock — Facility Stock Audit: ${selectedNode.name} (${selectedNode.code})\nGenerated: ${dateStr}\n\n`;
      csvContent += 'SKU,Product Name,Unit Price,Quantity,Total Valuation\n';
      selectedNode.inventory?.forEach(inv => {
        const value = (inv.quantity * Number(inv.product.price)).toFixed(2);
        csvContent += `"${inv.product.sku}","${inv.product.name}",$${inv.product.price},${inv.quantity},$${value}\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AtomicStock_Telemetry_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageWrapper>
      <div className="w-full min-h-full flex flex-col space-y-6 font-sans pb-12">

        {/* Global Navigation Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#E5E5EA] pb-5 gap-4">
          <div className="min-w-0 max-w-full">
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="flex items-center text-xs font-bold text-[#0071E3] hover:underline mb-2 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Return to Network Oversight
              </button>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1D1D1F] tracking-tight font-display truncate">
                {selectedNode ? selectedNode.name : 'Command Center'}
              </h1>
              <span className="px-2.5 py-1 bg-[#1D1D1F] text-white text-[10px] sm:text-[11px] rounded-lg uppercase tracking-wider font-bold shadow-xs whitespace-nowrap">
                {selectedNode ? `Node: ${selectedNode.code}` : 'Global Enterprise V2.4'}
              </span>
            </div>
            <p className="text-[#86868B] mt-1.5 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
              {selectedNode
                ? `Inspecting localized telemetry, capacity limits, and inventory distribution for ${selectedNode.location}.`
                : 'Real-time aggregate telemetry, velocity forecasting, and cross-node inventory distribution.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <AnimatePresence>
              {lastUpdate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center text-xs font-semibold text-[#1D1D1F] glass-pill px-3 sm:px-3.5 py-2 rounded-full shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 text-[#0071E3] mr-1.5 sm:mr-2 animate-pulse" />
                  <span className="truncate">Live Telemetry: {lastUpdate}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={downloadReport}
              className="flex items-center justify-center bg-[#1D1D1F] hover:bg-black text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 flex-1 md:flex-initial"
            >
              <Download className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="truncate">{selectedNode ? 'Export Facility Manifest' : 'Export Executive Report'}</span>
            </motion.button>
          </div>
        </div>

        {/* Top-Level Enterprise Module Tabs */}
        {!selectedNode && (
          <div className="flex items-center space-x-2 border-b border-[#E5E5EA] pb-2.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'OVERVIEW', label: 'Inventory Overview', icon: Layers },
              { id: 'PREDICTIVE_RESTOCK', label: 'Stockout Velocity & Reorders', icon: Sparkles },
              { id: 'DEAD_STOCK', label: 'Inventory Aging & Dead Stock', icon: ShieldAlert },
              { id: 'AUDIT_LEDGER', label: 'Transaction Log', icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`flex items-center px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1D1D1F] text-white shadow-xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-white/80 border border-transparent hover:border-[#E5E5EA]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 mr-2 ${isActive ? 'text-white' : 'text-[#86868B]'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 1: COMMAND OVERVIEW */}
        {activeTab === 'OVERVIEW' && !selectedNode && (
          <>
            {/* Row 1: KPI Cards */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5"
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} className="min-w-0">
                <KpiCard label="Master Catalog SKUs" value={loading ? 0 : stats.totalProducts} icon={<PackageSearch className="w-5 h-5 text-[#1D1D1F]" />} />
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} className="min-w-0">
                <KpiCard label="Network Physical Stock" value={loading ? 0 : stats.totalStock} icon={<Activity className="w-5 h-5 text-[#0071E3]" />} />
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} className="min-w-0">
                <KpiCard label="Active Regional Facilities" value={loading ? 0 : stats.activeNodes} icon={<Server className="w-5 h-5 text-[#34C759]" />} />
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} className="min-w-0">
                <KpiCard
                  label="Consolidated Asset Valuation"
                  value={loading ? 0 : Math.round(stats.totalValue)}
                  prefix="$"
                  icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                  dark
                  onClick={() => setActiveCard(activeCard === 'capital' ? null : 'capital')}
                >
                  <AnimatePresence>
                    {activeCard === 'capital' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-white/20 overflow-hidden"
                      >
                        <div className="flex justify-between text-xs mb-2 text-gray-300 font-medium">
                          <span>Estimated COGS:</span>
                          <span className="font-mono">${globalPnL.cogs.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-emerald-400">
                          <span>Projected Gross Margin:</span>
                          <span className="flex items-center font-mono">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            ${globalPnL.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </KpiCard>
              </motion.div>
            </motion.div>

            {/* Row 2: Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl md:rounded-[22px] p-5 sm:p-6 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] lg:col-span-2"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] flex items-center font-display">
                      <BarChart3 className="w-4.5 h-4.5 mr-2 text-[#0071E3]" /> Warehouse Capacity
                    </h2>
                    <p className="text-xs text-[#86868B] mt-0.5">Physical storage utilization relative to max threshold</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F5F5F7] rounded-md text-[#86868B] uppercase">Live</span>
                </div>

                {barChartData.length === 0 ? (
                  <EmptyState icon={<BarChart3 className="w-7 h-7" />} title="No facility data available" subtitle="Register regional fulfillment hubs to monitor capacity." />
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#86868B', fontSize: 11, fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#86868B', fontSize: 11 }} />
                        <RechartsTooltip cursor={{ fill: '#F5F5F7' }} />
                        <Bar dataKey="Utilization" radius={[6, 6, 0, 0]} maxBarSize={48}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.Utilization > 85 ? '#FF3B30' : '#0071E3'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl md:rounded-[22px] p-5 sm:p-6 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] flex items-center font-display">
                    <PieChartIcon className="w-4.5 h-4.5 mr-2 text-[#0071E3]" /> Capital Distribution
                  </h2>
                  <p className="text-xs text-[#86868B] mt-0.5">Inventory value allocated by facility</p>
                </div>

                <div className="h-[190px] w-full flex items-center justify-center my-3">
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={56} outerRadius={78} paddingAngle={4} dataKey="value" stroke="none">
                          {pieChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(val: any) => [`$${Number(val || 0).toLocaleString()}`, 'Valuation']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState icon={<PieChartIcon className="w-6 h-6" />} title="Zero capital recorded" />
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#E5E5EA] justify-center">
                  {pieChartData.map((d, idx) => (
                    <div key={d.name} className="flex items-center text-[10px] font-bold text-[#86868B] px-2 py-1 bg-[#F5F5F7] rounded-lg">
                      <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Row 3: Hub Inspection, Low-Stock & Top Assets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-[#0071E3]" /> Regional Facility Oversight
                  </h2>
                  <span className="text-xs text-[#86868B] font-semibold">Click node for manifest drill-down</span>
                </div>

                {warehouses.length === 0 ? (
                  <EmptyState icon={<Server className="w-7 h-7" />} title="No warehouse nodes deployed" subtitle="Initialize fulfillment nodes to populate facility radar." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    {warehouses.map(wh => {
                      const whStock = wh.inventory?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                      const whValue = wh.inventory?.reduce((acc, item) => acc + (item.quantity * Number(item.product.price)), 0) || 0;
                      const capacityPct = Math.min(Math.round((whStock / wh.capacity) * 100), 100);
                      const whPnL = calculatePnL(whValue);

                      return (
                        <motion.div
                          key={wh.id}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setSelectedNode(wh)}
                          className="liquid-glass rounded-2xl md:rounded-[22px] p-4 sm:p-5 lg:p-6 cursor-pointer flex flex-col justify-between group min-w-0 max-w-full"
                        >
                          <div className="min-w-0">
                            <div className="flex justify-between items-start mb-2.5">
                              <span className="px-2 py-0.5 bg-black/[0.04] group-hover:bg-[#0071E3] group-hover:text-white text-[#1D1D1F] text-[10px] font-bold rounded-md uppercase tracking-wider transition-colors border border-black/[0.06]">
                                {wh.code}
                              </span>
                              <ChevronRight className="w-4 h-4 text-[#86868B] group-hover:text-[#0071E3] transition-colors" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] tracking-tight font-display truncate">{wh.name}</h3>
                            <p className="text-xs text-[#86868B] mt-0.5 font-medium truncate">{wh.location}</p>
                          </div>

                          <div className="mt-4 pt-3.5 border-t border-[#E5E5EA] space-y-2.5 min-w-0">
                            <div className="flex justify-between text-xs font-semibold gap-2">
                              <span className="text-[#86868B] truncate">Asset Valuation:</span>
                              <span className="text-[#1D1D1F] font-mono font-bold shrink-0">${whValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex justify-between text-xs font-semibold gap-2">
                              <span className="text-[#86868B] truncate">Gross Margin (30%):</span>
                              <span className="text-emerald-600 font-mono font-bold shrink-0">+${whPnL.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex justify-between items-center text-[11px] font-bold mb-1.5 gap-2">
                                <span className="text-[#86868B] truncate text-[10px] sm:text-[11px]">
                                  Capacity: {whStock.toLocaleString()} / {wh.capacity.toLocaleString()}
                                </span>
                                <span className={`shrink-0 ${capacityPct > 85 ? 'text-rose-600' : 'text-[#0071E3]'}`}>{capacityPct}%</span>
                              </div>
                              <div className="w-full h-1.5 sm:h-2 bg-black/[0.04] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${capacityPct > 85 ? 'bg-rose-500' : 'bg-[#0071E3]'}`}
                                  style={{ width: `${capacityPct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-5 sm:space-y-6 min-w-0">
                {/* Critical Stock Alerts with Glass Styling */}
                <div className="liquid-glass rounded-2xl md:rounded-[22px] p-5 sm:p-6 min-w-0 max-w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center font-display truncate">
                      <AlertTriangle className="w-4 h-4 mr-2 text-amber-500 shrink-0" /> Critical Stock Watchlist
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200 shrink-0">
                      Floor Risk
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {criticalStock.length === 0 ? (
                      <p className="text-xs text-[#86868B]">Zero inventory alerts across active facilities.</p>
                    ) : (
                      criticalStock.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#1D1D1F] font-mono truncate">{item.product.sku}</p>
                            <p className="text-[10px] text-[#86868B] truncate">{item.product.name} ({item.nodeCode})</p>
                          </div>
                          <span className="px-2 py-1 bg-white text-amber-800 text-xs font-bold rounded-lg shadow-2xs border border-amber-200 shrink-0">
                            {item.quantity} left
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Top Network Assets with Glass Styling */}
                <div className="liquid-glass rounded-2xl md:rounded-[22px] p-5 sm:p-6 min-w-0 max-w-full">
                  <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center mb-4 font-display">
                    <Award className="w-4 h-4 mr-2 text-[#0071E3] shrink-0" /> Top Capital Allocation
                  </h3>
                  <div className="space-y-3.5">
                    {topAssets.length === 0 ? (
                      <p className="text-xs text-[#86868B]">Zero capital recorded.</p>
                    ) : (
                      topAssets.map((asset, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs gap-2 min-w-0">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-bold text-[#1D1D1F] font-mono truncate">{asset.sku}</span>
                            <span className="text-[10px] text-[#86868B] truncate" title={asset.name}>
                              {asset.name}
                            </span>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            <span className="font-bold text-[#1D1D1F] font-mono">
                              ${asset.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-[10px] text-[#86868B]">{asset.quantity.toLocaleString()} units net</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: PREDICTIVE RUN-OUT & VELOCITY ENGINE */}
        {activeTab === 'PREDICTIVE_RESTOCK' && !selectedNode && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-2xl md:rounded-[22px] p-5 sm:p-6 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F] flex items-center font-display">
                  <Sparkles className="w-5 h-5 mr-2 text-[#0071E3]" />
                  Stockout Velocity & Reorder Recommendations
                </h2>
                <p className="text-xs text-[#86868B] mt-1">
                  Calculates daily consumption rate from recent floor sales to forecast days of stock remaining.
                </p>
              </div>
              <button
                onClick={fetchAdvancedMetrics}
                className="px-3.5 py-2 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-xs font-bold rounded-xl transition-colors flex items-center border border-[#E5E5EA]"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingAdvanced ? 'animate-spin' : ''}`} />
                Recalculate Bounds
              </button>
            </div>

            <div className="bg-white rounded-2xl md:rounded-[22px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E5E5EA] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead className="bg-[#F5F5F7] border-b border-[#E5E5EA]">
                    <tr>
                      <th className="py-3.5 px-6 text-xs font-bold text-[#86868B] uppercase">SKU / Item Identity</th>
                      <th className="py-3.5 px-6 text-xs font-bold text-[#86868B] uppercase">Node Location</th>
                      <th className="py-3.5 px-6 text-xs font-bold text-[#86868B] uppercase text-right">Physical Stock</th>
                      <th className="py-3.5 px-6 text-xs font-bold text-[#86868B] uppercase text-right">Daily Velocity</th>
                      <th className="py-3.5 px-6 text-xs font-bold text-[#86868B] uppercase text-center">Days to Stockout</th>
                      <th className="py-3.5 px-6 text-xs font-bold text-[#86868B] uppercase text-right">Recommended EOQ Reorder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA] text-xs">
                    {predictions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#86868B]">
                          No velocity transactions recorded in trailing window.
                        </td>
                      </tr>
                    ) : (
                      predictions.map(item => {
                        const isCritical = item.urgency === 'CRITICAL';
                        const isWarning = item.urgency === 'WARNING';

                        return (
                          <tr key={item.id} className="hover:bg-black/[0.02] transition-colors">
                            <td className="py-4 px-6">
                              <p className="font-bold text-[#1D1D1F] font-mono">{item.sku}</p>
                              <p className="text-[10px] text-[#86868B] truncate max-w-xs">{item.name}</p>
                            </td>
                            <td className="py-4 px-6 font-semibold">
                              <span className="px-2 py-0.5 bg-black/[0.04] rounded text-[10px] uppercase font-bold border border-[#E5E5EA]">
                                {item.warehouseCode}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-bold font-mono text-sm">
                              {item.currentStock.toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-right font-mono font-semibold text-[#86868B]">
                              {item.dailyVelocity} units/day
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  isCritical
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                    : isWarning
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {item.daysRemaining} days remaining
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {item.recommendedReorder > 0 ? (
                                <span className="text-xs font-bold text-[#0071E3] font-mono bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                  +{item.recommendedReorder} units suggested
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-emerald-600">Optimal Buffer</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: DEAD-STOCK & AGING DIAGNOSTIC */}
        {activeTab === 'DEAD_STOCK' && !selectedNode && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Summary Cards with Liquid Glass */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              <div className="liquid-glass rounded-2xl md:rounded-[22px] p-4 sm:p-5 lg:p-6 min-w-0 max-w-full">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1 truncate">Tied-Up Working Capital</p>
                <p className="text-2xl sm:text-3xl font-bold text-rose-600 font-mono truncate max-w-full block">
                  ${inventoryHealth?.summary?.deadStockCapital?.toLocaleString() || '0'}
                </p>
                <p className="text-[11px] text-[#86868B] mt-2 font-medium truncate">Assets exceeding 60-day shelf stagnation</p>
              </div>

              <div className="liquid-glass rounded-2xl md:rounded-[22px] p-4 sm:p-5 lg:p-6 min-w-0 max-w-full">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1 truncate">Stagnant Inventory Value</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600 font-mono truncate max-w-full block">
                  ${inventoryHealth?.summary?.stagnantCapital?.toLocaleString() || '0'}
                </p>
                <p className="text-[11px] text-[#86868B] mt-2 font-medium truncate">Assets between 30 to 60 days without movement</p>
              </div>

              <div className="liquid-glass rounded-2xl md:rounded-[22px] p-4 sm:p-5 lg:p-6 min-w-0 max-w-full sm:col-span-2 md:col-span-1">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1 truncate">Healthy Working Capital</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono truncate max-w-full block">
                  ${inventoryHealth?.summary?.healthyCapital?.toLocaleString() || '0'}
                </p>
                <p className="text-[11px] text-[#86868B] mt-2 font-medium truncate">Active stock within optimal 30-day turnover window</p>
              </div>
            </div>

            {/* Classification Table with Glass Container */}
            <div className="liquid-glass rounded-2xl md:rounded-[22px] overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[#E5E5EA] bg-white/40 flex justify-between items-center">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1D1D1F] font-display">Inventory Aging & Liquidation Discounts</h3>
                  <p className="text-[11px] text-[#86868B] mt-0.5">Identify slow-moving stock and apply promotional discounts to free working capital.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead className="bg-[#F5F5F7]/80 border-b border-[#E5E5EA] text-xs font-bold text-[#86868B] uppercase">
                    <tr>
                      <th className="py-3.5 px-6">SKU / Item</th>
                      <th className="py-3.5 px-6">Facility</th>
                      <th className="py-3.5 px-6 text-right">Units</th>
                      <th className="py-3.5 px-6 text-right">Frozen Valuation</th>
                      <th className="py-3.5 px-6 text-center">Shelf Age</th>
                      <th className="py-3.5 px-6 text-center">Aging Category</th>
                      <th className="py-3.5 px-6 text-right">Liquidation Discount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA] text-xs">
                    {!inventoryHealth?.items || inventoryHealth.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#86868B]">
                          No aging inventory detected across network.
                        </td>
                      </tr>
                    ) : (
                      inventoryHealth.items.map((row: any) => (
                        <tr key={row.id} className="hover:bg-black/[0.02] transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-bold text-[#1D1D1F] font-mono">{row.sku}</p>
                            <p className="text-[10px] text-[#86868B] truncate max-w-xs">{row.name}</p>
                          </td>
                          <td className="py-4 px-6 font-bold uppercase">{row.warehouseCode}</td>
                          <td className="py-4 px-6 text-right font-mono font-bold">{row.quantity}</td>
                          <td className="py-4 px-6 text-right font-mono font-bold text-[#1D1D1F]">
                            ${row.tiedUpValue.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-center font-mono">{row.ageDays} days</td>
                          <td className="py-4 px-6 text-center">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                row.status === 'DEAD_STOCK'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : row.status === 'STAGNANT'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {row.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-bold">
                            {row.recommendedMarkdownPct > 0 ? (
                              <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                                -{row.recommendedMarkdownPct}% Markdown
                              </span>
                            ) : (
                              <span className="text-gray-400">Standard Margin</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: TRANSACTION LOG */}
        {activeTab === 'AUDIT_LEDGER' && !selectedNode && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="liquid-glass rounded-2xl md:rounded-[22px] p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F] flex items-center font-display">
                  <Clock className="w-5 h-5 mr-2 text-[#0071E3]" />
                  System Transaction Log
                </h2>
                <p className="text-xs text-[#86868B] mt-1">
                  Chronological history of all inbound shipments and outbound customer sales.
                </p>
              </div>
              <span className="text-xs font-bold text-[#86868B] glass-pill px-3 py-1.5 rounded-full">
                Recent Transactions
              </span>
            </div>

            <div className="liquid-glass rounded-2xl md:rounded-[22px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead className="bg-[#F5F5F7]/80 border-b border-[#E5E5EA] text-xs font-bold text-[#86868B] uppercase">
                    <tr>
                      <th className="py-3.5 px-6">Timestamp</th>
                      <th className="py-3.5 px-6">Transaction Type</th>
                      <th className="py-3.5 px-6">SKU / Item Name</th>
                      <th className="py-3.5 px-6">Warehouse Hub</th>
                      <th className="py-3.5 px-6 text-right">Quantity Change</th>
                      <th className="py-3.5 px-6">Order Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA] text-xs">
                    {auditTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#86868B]">
                          No audit entries committed yet.
                        </td>
                      </tr>
                    ) : (
                      auditTransactions.map(tx => {
                        const isInbound = tx.type === 'INBOUND';
                        return (
                          <tr key={tx.id} className="hover:bg-black/[0.02] transition-colors">
                            <td className="py-3.5 px-6 font-mono text-[#86868B] whitespace-nowrap">
                              {new Date(tx.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-6">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isInbound
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isInbound ? <ArrowDownRight className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />}
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-6">
                              <p className="font-bold text-[#1D1D1F] font-mono">{tx.product?.sku}</p>
                              <p className="text-[10px] text-[#86868B] truncate max-w-xs">{tx.product?.name}</p>
                            </td>
                            <td className="py-3.5 px-6 font-bold uppercase text-[#1D1D1F]">
                              {tx.warehouse?.code}
                            </td>
                            <td className={`py-3.5 px-6 text-right font-mono font-bold text-sm ${isInbound ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                            </td>
                            <td className="py-3.5 px-6 font-mono text-[11px] text-[#86868B]">
                              {tx.reference || 'SYSTEM_ATOMIC_TX'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* NODE DRILL-DOWN VIEW (FACILITY LEVEL) */}
        {selectedNode && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="liquid-glass rounded-2xl p-4 sm:p-5 min-w-0 max-w-full">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1 truncate">Local SKUs Allocated</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1D1D1F] truncate block">{selectedNode.inventory?.length || 0}</p>
              </div>
              <div className="liquid-glass rounded-2xl p-4 sm:p-5 min-w-0 max-w-full">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1 truncate">Volumetric Capacity</p>
                <p className="text-xl sm:text-2xl font-bold text-[#0071E3] font-mono truncate block">
                  {Math.round(((selectedNode.inventory?.reduce((a, i) => a + i.quantity, 0) || 0) / selectedNode.capacity) * 100)}%
                </p>
              </div>
              <div className="liquid-glass rounded-2xl p-4 sm:p-5 min-w-0 max-w-full">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1 truncate">Facility Valuation</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1D1D1F] font-mono truncate block">
                  ${(selectedNode.inventory?.reduce((a, i) => a + (i.quantity * Number(i.product.price)), 0) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="liquid-glass-dark text-white rounded-2xl p-4 sm:p-5 min-w-0 max-w-full">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 truncate">Projected Gross Margin</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono truncate block">
                  +${calculatePnL(selectedNode.inventory?.reduce((a, i) => a + (i.quantity * Number(i.product.price)), 0) || 0).profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="liquid-glass rounded-2xl md:rounded-[22px] overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-[#E5E5EA] bg-white/40 flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] font-display">Facility Inventory Manifest</h3>
                <span className="text-xs font-bold text-[#86868B] font-mono">
                  Node Code: {selectedNode.code}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead className="bg-[#F5F5F7]/80 border-b border-[#E5E5EA]">
                    <tr>
                      <th className="py-3.5 px-6 text-xs font-bold text-[#86868B] uppercase">SKU Barcode</th>
                      <th className="py-3.5 px-6 text-xs font-bold text-[#86868B] uppercase">Product Name</th>
                      <th className="py-3.5 px-6 text-xs font-bold text-[#86868B] uppercase">Unit Price</th>
                      <th className="py-3.5 px-6 text-xs font-bold text-[#86868B] uppercase text-right">Node Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA] text-xs">
                    {selectedNode.inventory?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-sm font-medium text-[#86868B]">
                          Zero inventory allocated at this facility node.
                        </td>
                      </tr>
                    ) : (
                      selectedNode.inventory?.map(inv => (
                        <tr key={inv.id} className="hover:bg-black/[0.02] transition-colors">
                          <td className="py-3.5 px-6 font-bold text-[#0071E3] font-mono">{inv.product.sku}</td>
                          <td className="py-3.5 px-6 text-sm font-semibold text-[#1D1D1F]">{inv.product.name}</td>
                          <td className="py-3.5 px-6 text-xs font-semibold text-[#1D1D1F] font-mono">${inv.product.price}</td>
                          <td className="py-3.5 px-6 text-sm font-bold text-right text-[#1D1D1F] font-mono">
                            <span className={inv.quantity < 10 ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200' : ''}>
                              {inv.quantity.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
