import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Kaggle-inspired Retail Inventory Dataset for AtomicStock...');

  // 1. Roles
  const roles = [
    'GLOBAL_ADMIN',
    'NODE_MANAGER',
    'INBOUND_SPECIALIST',
    'OUTBOUND_SPECIALIST',
    'INVENTORY_AUDITOR',
    'UNASSIGNED'
  ];
  const roleMap: Record<string, string> = {};

  for (const r of roles) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r, permissions: [r] }
    });
    roleMap[r] = roleRecord.id;
  }

  // 2. Regional Warehouse Hubs (Real-World Logistics Nodes)
  const delhi = await prisma.warehouse.upsert({
    where: { code: 'DEL-01' },
    update: { name: 'Delhi NCR Central Fulfilment Hub', location: 'Gurugram, Haryana', capacity: 15000 },
    create: { code: 'DEL-01', name: 'Delhi NCR Central Fulfilment Hub', location: 'Gurugram, Haryana', capacity: 15000 }
  });

  const mumbai = await prisma.warehouse.upsert({
    where: { code: 'MUM-01' },
    update: { name: 'Mumbai Western Maritime Logistics Hub', location: 'Bhiwandi, Maharashtra', capacity: 12000 },
    create: { code: 'MUM-01', name: 'Mumbai Western Maritime Logistics Hub', location: 'Bhiwandi, Maharashtra', capacity: 12000 }
  });

  const bangalore = await prisma.warehouse.upsert({
    where: { code: 'BLR-01' },
    update: { name: 'Bangalore South Technology Depot', location: 'Whitefield, Karnataka', capacity: 10000 },
    create: { code: 'BLR-01', name: 'Bangalore South Technology Depot', location: 'Whitefield, Karnataka', capacity: 10000 }
  });

  const kolkata = await prisma.warehouse.upsert({
    where: { code: 'KOL-01' },
    update: { name: 'Kolkata Eastern Regional Distribution Center', location: 'Dankuni, West Bengal', capacity: 8500 },
    create: { code: 'KOL-01', name: 'Kolkata Eastern Regional Distribution Center', location: 'Dankuni, West Bengal', capacity: 8500 }
  });

  // 3. Regional Suppliers (Real-World Enterprise Vendors)
  const suppliersData = [
    { name: 'Ingram Micro India Ltd', code: 'ING-DEL', contact: '+91 11-4560-1200', warehouseId: delhi.id },
    { name: 'Redington Distribution North', code: 'RED-DEL', contact: '+91 11-2875-9900', warehouseId: delhi.id },
    { name: 'Apex Logistics Mumbai', code: 'APX-MUM', contact: '+91 22-6789-3344', warehouseId: mumbai.id },
    { name: 'Blue Dart Freight Gateway', code: 'BDF-MUM', contact: '+91 22-8899-2211', warehouseId: mumbai.id },
    { name: 'Deccan Hardware & Silicon', code: 'DHS-BLR', contact: '+91 80-2345-6789', warehouseId: bangalore.id },
    { name: 'Tech Data South India', code: 'TDS-BLR', contact: '+91 80-4987-1122', warehouseId: bangalore.id },
    { name: 'Eastern Cargo Alliance', code: 'ECA-KOL', contact: '+91 33-2211-4455', warehouseId: kolkata.id },
  ];

  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({
      where: { code: s.code }
    });
    if (!existing) {
      await prisma.supplier.create({ data: s });
    }
  }

  // 4. Master Product Catalog (20+ Realistic SKUs from Kaggle Retail/Inventory Dataset)
  const products = [
    // Enterprise Workstations & Laptops
    { sku: 'APPL-MBP-M3M', name: 'Apple MacBook Pro 16" (M3 Max, 36GB, 1TB)', price: 3499.00, description: 'Flagship Apple Silicon developer workstation' },
    { sku: 'DELL-XPS-15', name: 'Dell XPS 15 9530 (i9-13900H, 32GB, 1TB, RTX 4070)', price: 2399.00, description: 'Creator OLED high-performance laptop' },
    { sku: 'LEN-X1C-G11', name: 'Lenovo ThinkPad X1 Carbon Gen 11 (i7, 16GB, 512GB)', price: 1649.00, description: 'Enterprise executive ultrabook with MIL-SPEC chassis' },
    { sku: 'ASUS-ZEPH-G14', name: 'ASUS ROG Zephyrus G14 OLED (Ryzen 9, 32GB, RTX 4070)', price: 1999.00, description: 'Compact engineering and 3D rendering mobile rig' },

    // GPUs & Components
    { sku: 'NVDA-RTX-4090', name: 'NVIDIA GeForce RTX 4090 24GB Founders Edition', price: 1599.00, description: 'Ada Lovelace 24GB G6X deep learning & graphics card' },
    { sku: 'NVDA-RTX-4070', name: 'NVIDIA GeForce RTX 4070 Super 12GB OC', price: 599.00, description: 'Mid-tier high-efficiency enterprise GPU' },
    { sku: 'SAM-990P-2TB', name: 'Samsung 990 PRO PCIe 4.0 NVMe M.2 SSD 2TB', price: 179.99, description: '7450 MB/s high-throughput solid state drive' },

    // Mobile & Handheld
    { sku: 'APPL-IP15P-256', name: 'Apple iPhone 15 Pro (256GB Natural Titanium)', price: 1099.00, description: 'A17 Pro USB-C flagship smartphone' },
    { sku: 'SMSG-S24U-512', name: 'Samsung Galaxy S24 Ultra (512GB Titanium Black)', price: 1299.00, description: 'Snapdragon 8 Gen 3 with S-Pen' },
    { sku: 'APPL-IPAD-P13', name: 'Apple iPad Pro 13" (M4 OLED, 256GB Wi-Fi)', price: 1299.00, description: 'Tandem OLED pro tablet with Apple Pencil Pro support' },

    // Peripherals & Displays
    { sku: 'SONY-WH1000XM5', name: 'Sony WH-1000XM5 Noise Canceling Headphones', price: 399.00, description: 'Industry benchmark active noise canceling headphones' },
    { sku: 'LOGI-MXM3S-GRY', name: 'Logitech MX Master 3S Wireless Mouse (Graphite)', price: 99.99, description: 'Quiet click 8000 DPI ergonomic workflow mouse' },
    { sku: 'LOGI-MXK-MECH', name: 'Logitech MX Mechanical Wireless Keyboard (Tactile)', price: 169.99, description: 'Low profile mechanical keys with smart illumination' },
    { sku: 'KEY-Q1-PRO', name: 'Keychron Q1 Pro Custom Mechanical Keyboard', price: 199.00, description: 'QMK/VIA wireless custom aluminum keyboard' },
    { sku: 'DELL-U3224KB', name: 'Dell UltraSharp 32" 6K HDR Monitor', price: 2199.00, description: '6144 x 3456 IPS Black enterprise color monitor' },

    // Warehouse & Logistics Floor Hardware
    { sku: 'ZEB-TC21-POS', name: 'Zebra TC21 Enterprise Touch Mobile Computer', price: 650.00, description: 'Industrial Android 2D barcode scanner with IP67 housing' },
    { sku: 'HON-1400G-USB', name: 'Honeywell Voyager 1400g 2D Barcode Scanner', price: 185.00, description: 'High-speed handheld omnidirectional USB scanner' },
    { sku: 'EPS-TM88VI-NET', name: 'Epson TM-T88VI Thermal Receipt Printer (Ethernet)', price: 320.00, description: 'High-speed 350mm/s POS receipt printer' },
    { sku: 'ANK-737-PB24K', name: 'Anker 737 Power Bank (PowerCore 24K, 140W)', price: 149.99, description: 'Smart digital display multi-device battery pack' },
    { sku: 'APPL-AW-U2', name: 'Apple Watch Ultra 2 (GPS + Cellular, 49mm Titanium)', price: 799.00, description: 'Rugged dive & trail smartwatch with Action button' }
  ];

  const productMap: Record<string, string> = {};
  for (const prod of products) {
    const p = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: { name: prod.name, price: prod.price, description: prod.description },
      create: prod
    });
    productMap[prod.sku] = p.id;
  }

  // 5. Multi-Node Inventory Distribution
  const stockDistributions = [
    // Delhi NCR Hub (DEL-01)
    { sku: 'APPL-MBP-M3M', warehouseId: delhi.id, quantity: 28 },
    { sku: 'APPL-IP15P-256', warehouseId: delhi.id, quantity: 4 },  // CRITICAL: Triggers predictive restock warning (< 5 units)
    { sku: 'NVDA-RTX-4090', warehouseId: delhi.id, quantity: 18 },
    { sku: 'NVDA-RTX-4070', warehouseId: delhi.id, quantity: 42 },
    { sku: 'SONY-WH1000XM5', warehouseId: delhi.id, quantity: 65 },
    { sku: 'LOGI-MXM3S-GRY', warehouseId: delhi.id, quantity: 140 },
    { sku: 'LOGI-MXK-MECH', warehouseId: delhi.id, quantity: 85 },
    { sku: 'SAM-990P-2TB', warehouseId: delhi.id, quantity: 120 },
    { sku: 'ZEB-TC21-POS', warehouseId: delhi.id, quantity: 15 },
    { sku: 'HON-1400G-USB', warehouseId: delhi.id, quantity: 30 },

    // Mumbai Western Hub (MUM-01)
    { sku: 'APPL-MBP-M3M', warehouseId: mumbai.id, quantity: 16 },
    { sku: 'DELL-XPS-15', warehouseId: mumbai.id, quantity: 22 },
    { sku: 'LEN-X1C-G11', warehouseId: mumbai.id, quantity: 14 },
    { sku: 'SMSG-S24U-512', warehouseId: mumbai.id, quantity: 38 },
    { sku: 'APPL-AW-U2', warehouseId: mumbai.id, quantity: 3 },    // CRITICAL: Stockout risk
    { sku: 'LOGI-MXM3S-GRY', warehouseId: mumbai.id, quantity: 95 },
    { sku: 'KEY-Q1-PRO', warehouseId: mumbai.id, quantity: 40 },
    { sku: 'EPS-TM88VI-NET', warehouseId: mumbai.id, quantity: 18 },
    { sku: 'ANK-737-PB24K', warehouseId: mumbai.id, quantity: 70 },

    // Bangalore Technology Hub (BLR-01)
    { sku: 'NVDA-RTX-4090', warehouseId: bangalore.id, quantity: 45 },
    { sku: 'ASUS-ZEPH-G14', warehouseId: bangalore.id, quantity: 25 },
    { sku: 'DELL-U3224KB', warehouseId: bangalore.id, quantity: 8 },  // WARNING: Low stock (< 10)
    { sku: 'APPL-IPAD-P13', warehouseId: bangalore.id, quantity: 34 },
    { sku: 'APPL-IP15P-256', warehouseId: bangalore.id, quantity: 50 },
    { sku: 'SAM-990P-2TB', warehouseId: bangalore.id, quantity: 160 },
    { sku: 'KEY-Q1-PRO', warehouseId: bangalore.id, quantity: 60 },
    { sku: 'ZEB-TC21-POS', warehouseId: bangalore.id, quantity: 24 },

    // Kolkata Eastern Depot (KOL-01)
    { sku: 'SONY-WH1000XM5', warehouseId: kolkata.id, quantity: 20 },
    { sku: 'LOGI-MXM3S-GRY', warehouseId: kolkata.id, quantity: 45 },
    { sku: 'HON-1400G-USB', warehouseId: kolkata.id, quantity: 12 },
    { sku: 'EPS-TM88VI-NET', warehouseId: kolkata.id, quantity: 8 },
    { sku: 'ANK-737-PB24K', warehouseId: kolkata.id, quantity: 35 },
    { sku: 'LEN-X1C-G11', warehouseId: kolkata.id, quantity: 5 }   // Stagnant inventory for health diagnostic
  ];

  for (const item of stockDistributions) {
    const productId = productMap[item.sku];
    if (!productId) continue;
    await prisma.inventory.upsert({
      where: {
        productId_warehouseId: { productId, warehouseId: item.warehouseId }
      },
      update: { quantity: item.quantity },
      create: { productId, warehouseId: item.warehouseId, quantity: item.quantity }
    });
  }

  // 6. Chronological Transaction Log (Inbound Shipments & Outbound Dispatches over past 40 days)
  const txHistory = [
    // Recent Floor Dispatches (Past 14 Days - Powers Predictive Velocity)
    { sku: 'APPL-IP15P-256', warehouseId: delhi.id, type: 'OUTBOUND' as const, quantity: -8, daysAgo: 1, ref: 'POS-DEL-9841' },
    { sku: 'APPL-IP15P-256', warehouseId: delhi.id, type: 'OUTBOUND' as const, quantity: -6, daysAgo: 3, ref: 'POS-DEL-9812' },
    { sku: 'APPL-IP15P-256', warehouseId: delhi.id, type: 'OUTBOUND' as const, quantity: -10, daysAgo: 6, ref: 'POS-DEL-9760' },
    { sku: 'APPL-MBP-M3M', warehouseId: delhi.id, type: 'OUTBOUND' as const, quantity: -4, daysAgo: 2, ref: 'POS-DEL-9820' },
    { sku: 'APPL-MBP-M3M', warehouseId: delhi.id, type: 'OUTBOUND' as const, quantity: -3, daysAgo: 5, ref: 'POS-DEL-9781' },
    { sku: 'NVDA-RTX-4090', warehouseId: delhi.id, type: 'OUTBOUND' as const, quantity: -5, daysAgo: 4, ref: 'POS-DEL-9799' },
    { sku: 'SONY-WH1000XM5', warehouseId: delhi.id, type: 'OUTBOUND' as const, quantity: -15, daysAgo: 3, ref: 'POS-DEL-9810' },
    { sku: 'LOGI-MXM3S-GRY', warehouseId: delhi.id, type: 'OUTBOUND' as const, quantity: -25, daysAgo: 1, ref: 'POS-DEL-9850' },
    { sku: 'LOGI-MXM3S-GRY', warehouseId: delhi.id, type: 'OUTBOUND' as const, quantity: -30, daysAgo: 7, ref: 'POS-DEL-9750' },

    // Mumbai Dispatches
    { sku: 'APPL-AW-U2', warehouseId: mumbai.id, type: 'OUTBOUND' as const, quantity: -5, daysAgo: 2, ref: 'POS-MUM-4421' },
    { sku: 'APPL-AW-U2', warehouseId: mumbai.id, type: 'OUTBOUND' as const, quantity: -4, daysAgo: 5, ref: 'POS-MUM-4390' },
    { sku: 'DELL-XPS-15', warehouseId: mumbai.id, type: 'OUTBOUND' as const, quantity: -3, daysAgo: 4, ref: 'POS-MUM-4402' },
    { sku: 'SMSG-S24U-512', warehouseId: mumbai.id, type: 'OUTBOUND' as const, quantity: -8, daysAgo: 3, ref: 'POS-MUM-4415' },

    // Bangalore Dispatches
    { sku: 'NVDA-RTX-4090', warehouseId: bangalore.id, type: 'OUTBOUND' as const, quantity: -8, daysAgo: 2, ref: 'POS-BLR-2190' },
    { sku: 'ASUS-ZEPH-G14', warehouseId: bangalore.id, type: 'OUTBOUND' as const, quantity: -5, daysAgo: 6, ref: 'POS-BLR-2144' },
    { sku: 'DELL-U3224KB', warehouseId: bangalore.id, type: 'OUTBOUND' as const, quantity: -3, daysAgo: 8, ref: 'POS-BLR-2101' },

    // Inbound Procurement Shipments (Past 35 Days)
    { sku: 'APPL-IP15P-256', warehouseId: delhi.id, type: 'INBOUND' as const, quantity: 28, daysAgo: 12, ref: 'PO-INGRAM-8841' },
    { sku: 'APPL-MBP-M3M', warehouseId: delhi.id, type: 'INBOUND' as const, quantity: 35, daysAgo: 20, ref: 'PO-REDINGTON-7712' },
    { sku: 'NVDA-RTX-4090', warehouseId: delhi.id, type: 'INBOUND' as const, quantity: 25, daysAgo: 18, ref: 'PO-INGRAM-8902' },
    { sku: 'SONY-WH1000XM5', warehouseId: delhi.id, type: 'INBOUND' as const, quantity: 100, daysAgo: 25, ref: 'PO-REDINGTON-7650' },
    { sku: 'LOGI-MXM3S-GRY', warehouseId: delhi.id, type: 'INBOUND' as const, quantity: 200, daysAgo: 30, ref: 'PO-APEX-5540' },
    { sku: 'SMSG-S24U-512', warehouseId: mumbai.id, type: 'INBOUND' as const, quantity: 50, daysAgo: 22, ref: 'PO-APEX-5588' },
    { sku: 'APPL-AW-U2', warehouseId: mumbai.id, type: 'INBOUND' as const, quantity: 15, daysAgo: 28, ref: 'PO-BLUEDART-3320' },
    { sku: 'NVDA-RTX-4090', warehouseId: bangalore.id, type: 'INBOUND' as const, quantity: 60, daysAgo: 15, ref: 'PO-TECHDATA-4410' },
    { sku: 'SAM-990P-2TB', warehouseId: bangalore.id, type: 'INBOUND' as const, quantity: 200, daysAgo: 35, ref: 'PO-DECCAN-1190' },

    // Older Stagnant Transactions (40+ days ago to create aging diagnostic contrast)
    { sku: 'LEN-X1C-G11', warehouseId: kolkata.id, type: 'INBOUND' as const, quantity: 5, daysAgo: 42, ref: 'PO-EASTERN-0091' }
  ];

  for (const tx of txHistory) {
    const productId = productMap[tx.sku];
    if (!productId) continue;

    const txDate = new Date();
    txDate.setDate(txDate.getDate() - tx.daysAgo);

    await prisma.transaction.create({
      data: {
        type: tx.type,
        quantity: tx.quantity,
        productId,
        warehouseId: tx.warehouseId,
        reference: tx.ref,
        timestamp: txDate
      }
    });
  }

  // 7. Seed Persona Test Accounts
  const personas = [
    {
      email: 'admin@tier1.com',
      name: 'Prateek Singh (Global Admin)',
      role: 'GLOBAL_ADMIN',
      warehouseId: null
    },
    {
      email: 'delhi.manager@tier1.com',
      name: 'Rajesh Sharma (Delhi Node Manager)',
      role: 'NODE_MANAGER',
      warehouseId: delhi.id
    },
    {
      email: 'mumbai.manager@tier1.com',
      name: 'Priya Mehta (Mumbai Node Manager)',
      role: 'NODE_MANAGER',
      warehouseId: mumbai.id
    },
    {
      email: 'operator@tier1.com',
      name: 'Amit Verma (Outbound Floor Operator)',
      role: 'OUTBOUND_SPECIALIST',
      warehouseId: delhi.id
    },
    {
      email: 'auditor@tier1.com',
      name: 'Vikram Seth (Inventory Auditor)',
      role: 'INVENTORY_AUDITOR',
      warehouseId: null
    }
  ];

  for (const p of personas) {
    await prisma.user.upsert({
      where: { email: p.email },
      update: {
        name: p.name,
        roleId: roleMap[p.role],
        warehouseId: p.warehouseId,
        status: 'ACTIVE'
      },
      create: {
        email: p.email,
        name: p.name,
        roleId: roleMap[p.role],
        warehouseId: p.warehouseId,
        status: 'ACTIVE'
      }
    });
  }

  console.log('✅ Seeding complete!');
  console.log(`- 4 Logistics Hubs (DEL-01, MUM-01, BLR-01, KOL-01)`);
  console.log(`- 20 Flagship Tech & Logistics Products`);
  console.log(`- 30 Multi-Node Inventory Records`);
  console.log(`- 25 Historical Transactions spanning 45 days`);
  console.log(`- 5 Evaluation Personas ready for 1-Click Testing`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
