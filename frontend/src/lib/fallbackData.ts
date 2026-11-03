export const FALLBACK_WAREHOUSES = [
  {
    id: 'wh-del-01',
    code: 'DEL-01',
    name: 'Delhi NCR Central Fulfilment Hub',
    location: 'Gurugram, Haryana',
    capacity: 15000,
    inventory: [
      { id: 'inv-1', quantity: 420, product: { sku: 'APPL-MBP-M3M', name: 'Apple MacBook Pro 16" (M3 Max, 36GB, 1TB)', price: 3499.00 } },
      { id: 'inv-2', quantity: 280, product: { sku: 'DELL-XPS-15', name: 'Dell XPS 15 9530 (i9-13900H, 32GB, 1TB)', price: 2399.00 } },
      { id: 'inv-3', quantity: 850, product: { sku: 'NVDA-RTX-4090', name: 'NVIDIA GeForce RTX 4090 24GB Founders Edition', price: 1599.00 } },
      { id: 'inv-4', quantity: 1200, product: { sku: 'APPL-IP15P-256', name: 'Apple iPhone 15 Pro (256GB Natural Titanium)', price: 1099.00 } },
      { id: 'inv-5', quantity: 35, product: { sku: 'ZEB-TC21-POS', name: 'Zebra TC21 Enterprise Touch Mobile Computer', price: 650.00 } }
    ]
  },
  {
    id: 'wh-mum-01',
    code: 'MUM-01',
    name: 'Mumbai Western Maritime Logistics Hub',
    location: 'Bhiwandi, Maharashtra',
    capacity: 12000,
    inventory: [
      { id: 'inv-6', quantity: 310, product: { sku: 'LEN-X1C-G11', name: 'Lenovo ThinkPad X1 Carbon Gen 11 (i7, 16GB, 512GB)', price: 1649.00 } },
      { id: 'inv-7', quantity: 540, product: { sku: 'SAM-990P-2TB', name: 'Samsung 990 PRO PCIe 4.0 NVMe M.2 SSD 2TB', price: 179.99 } },
      { id: 'inv-8', quantity: 720, product: { sku: 'SONY-WH1000XM5', name: 'Sony WH-1000XM5 Noise Canceling Headphones', price: 399.00 } }
    ]
  },
  {
    id: 'wh-blr-01',
    code: 'BLR-01',
    name: 'Bangalore South Technology Depot',
    location: 'Whitefield, Karnataka',
    capacity: 10000,
    inventory: [
      { id: 'inv-9', quantity: 480, product: { sku: 'ASUS-ZEPH-G14', name: 'ASUS ROG Zephyrus G14 OLED (Ryzen 9, 32GB)', price: 1999.00 } },
      { id: 'inv-10', quantity: 610, product: { sku: 'SMSG-S24U-512', name: 'Samsung Galaxy S24 Ultra (512GB)', price: 1299.00 } },
      { id: 'inv-11', quantity: 950, product: { sku: 'LOGI-MXM3S-GRY', name: 'Logitech MX Master 3S Wireless Mouse', price: 99.99 } }
    ]
  },
  {
    id: 'wh-kol-01',
    code: 'KOL-01',
    name: 'Kolkata Eastern Regional Distribution Center',
    location: 'Dankuni, West Bengal',
    capacity: 8500,
    inventory: [
      { id: 'inv-12', quantity: 290, product: { sku: 'DELL-U3224KB', name: 'Dell UltraSharp 32" 6K HDR Monitor', price: 2199.00 } },
      { id: 'inv-13', quantity: 410, product: { sku: 'APPL-IPAD-P13', name: 'Apple iPad Pro 13" (M4 OLED, 256GB)', price: 1299.00 } }
    ]
  }
];

export const FALLBACK_PRODUCTS = [
  { id: 'p-1', sku: 'APPL-MBP-M3M', name: 'Apple MacBook Pro 16" (M3 Max, 36GB, 1TB)', category: 'Laptops', price: 3499.00, stock: 420 },
  { id: 'p-2', sku: 'DELL-XPS-15', name: 'Dell XPS 15 9530 (i9-13900H, 32GB, 1TB)', category: 'Laptops', price: 2399.00, stock: 280 },
  { id: 'p-3', sku: 'LEN-X1C-G11', name: 'Lenovo ThinkPad X1 Carbon Gen 11', category: 'Laptops', price: 1649.00, stock: 310 },
  { id: 'p-4', sku: 'ASUS-ZEPH-G14', name: 'ASUS ROG Zephyrus G14 OLED', category: 'Laptops', price: 1999.00, stock: 480 },
  { id: 'p-5', sku: 'NVDA-RTX-4090', name: 'NVIDIA GeForce RTX 4090 24GB Founders Edition', category: 'Components', price: 1599.00, stock: 850 },
  { id: 'p-6', sku: 'NVDA-RTX-4070', name: 'NVIDIA GeForce RTX 4070 Super 12GB OC', category: 'Components', price: 599.00, stock: 650 },
  { id: 'p-7', sku: 'SAM-990P-2TB', name: 'Samsung 990 PRO PCIe 4.0 NVMe M.2 SSD 2TB', category: 'Components', price: 179.99, stock: 540 },
  { id: 'p-8', sku: 'APPL-IP15P-256', name: 'Apple iPhone 15 Pro (256GB Natural Titanium)', category: 'Mobile', price: 1099.00, stock: 1200 },
  { id: 'p-9', sku: 'SMSG-S24U-512', name: 'Samsung Galaxy S24 Ultra (512GB Titanium Black)', category: 'Mobile', price: 1299.00, stock: 610 },
  { id: 'p-10', sku: 'APPL-IPAD-P13', name: 'Apple iPad Pro 13" (M4 OLED, 256GB Wi-Fi)', category: 'Mobile', price: 1299.00, stock: 410 },
  { id: 'p-11', sku: 'SONY-WH1000XM5', name: 'Sony WH-1000XM5 Noise Canceling Headphones', category: 'Peripherals', price: 399.00, stock: 720 },
  { id: 'p-12', sku: 'LOGI-MXM3S-GRY', name: 'Logitech MX Master 3S Wireless Mouse', category: 'Peripherals', price: 99.99, stock: 950 },
  { id: 'p-13', sku: 'LOGI-MXK-MECH', name: 'Logitech MX Mechanical Wireless Keyboard', category: 'Peripherals', price: 169.99, stock: 380 },
  { id: 'p-14', sku: 'KEY-Q1-PRO', name: 'Keychron Q1 Pro Custom Mechanical Keyboard', category: 'Peripherals', price: 199.00, stock: 290 },
  { id: 'p-15', sku: 'DELL-U3224KB', name: 'Dell UltraSharp 32" 6K HDR Monitor', category: 'Peripherals', price: 2199.00, stock: 290 },
  { id: 'p-16', sku: 'ZEB-TC21-POS', name: 'Zebra TC21 Enterprise Touch Mobile Computer', category: 'Industrial', price: 650.00, stock: 35 },
  { id: 'p-17', sku: 'HON-1400G-USB', name: 'Honeywell Voyager 1400g 2D Barcode Scanner', category: 'Industrial', price: 185.00, stock: 210 }
];

export const FALLBACK_ANALYTICS = {
  totalProducts: 17,
  totalStock: 8245,
  activeNodes: 4,
  totalValue: 9845200
};

export const FALLBACK_PREDICTIONS = [
  {
    sku: 'ZEB-TC21-POS',
    name: 'Zebra TC21 Enterprise Touch Mobile Computer',
    currentStock: 35,
    dailyVelocity: 7.2,
    daysUntilDepletion: 4.8,
    reorderUrgency: 'HIGH',
    suggestedReorderQuantity: 250
  },
  {
    sku: 'APPL-MBP-M3M',
    name: 'Apple MacBook Pro 16" (M3 Max, 36GB, 1TB)',
    currentStock: 420,
    dailyVelocity: 14.5,
    daysUntilDepletion: 28.9,
    reorderUrgency: 'NORMAL',
    suggestedReorderQuantity: 500
  },
  {
    sku: 'NVDA-RTX-4090',
    name: 'NVIDIA GeForce RTX 4090 24GB Founders Edition',
    currentStock: 850,
    dailyVelocity: 22.0,
    daysUntilDepletion: 38.6,
    reorderUrgency: 'NORMAL',
    suggestedReorderQuantity: 600
  }
];

export const FALLBACK_HEALTH = {
  deadStockValue: 142500,
  turnoverRatio: 4.8,
  agingTiers: [
    { tier: '0-30 Days', count: 5200, percentage: 63 },
    { tier: '31-60 Days', count: 2100, percentage: 25 },
    { tier: '61-90 Days', count: 680, percentage: 8 },
    { tier: '90+ Days (Dead Stock)', count: 265, percentage: 4 }
  ]
};

export const FALLBACK_TRANSACTIONS = [
  { id: 'tx-1', type: 'OUTBOUND', sku: 'APPL-MBP-M3M', quantity: 2, sellingPrice: 4198.80, status: 'COMPLETED', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'tx-2', type: 'INBOUND', sku: 'NVDA-RTX-4090', quantity: 50, sellingPrice: 0, status: 'COMPLETED', createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
  { id: 'tx-3', type: 'OUTBOUND', sku: 'LOGI-MXM3S-GRY', quantity: 5, sellingPrice: 129.99, status: 'COMPLETED', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 'tx-4', type: 'OUTBOUND', sku: 'APPL-IP15P-256', quantity: 1, sellingPrice: 1399.00, status: 'COMPLETED', createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
];
