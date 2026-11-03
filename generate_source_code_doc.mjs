import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const filesToInclude = [
  // 1. ARCHITECTURE & DEPLOYMENT
  {
    category: '1. Architecture & Container Orchestration',
    path: 'docker-compose.prod.yml',
    desc: 'Multi-container production orchestration defining PostgreSQL 16 ACID engine, Redis caching cluster, Express API backend, and Nginx reverse proxy.'
  },
  {
    category: '1. Architecture & Container Orchestration',
    path: 'render.yaml',
    desc: 'Infrastructure-as-Code (IaC) Render Blueprint configuring auto-deploying managed PostgreSQL, Node.js web services, and React static SPA.'
  },
  {
    category: '1. Architecture & Container Orchestration',
    path: 'frontend/nginx.conf',
    desc: 'High-concurrency Nginx reverse proxy routing client SPA routes, WebSocket multiplexing, and rate-limited REST API gateways.'
  },
  {
    category: '1. Architecture & Container Orchestration',
    path: 'backend/Dockerfile',
    desc: 'Multi-stage Docker containerization for the Express.js / TypeScript enterprise backend with Prisma runtime binaries.'
  },
  {
    category: '1. Architecture & Container Orchestration',
    path: 'frontend/Dockerfile',
    desc: 'Production container build compiling the Vite React 19 SPA and embedding into an Alpine Nginx server image.'
  },

  // 2. DATABASE SCHEMA & DATA MODELING
  {
    category: '2. Database Schema & Data Models',
    path: 'backend/prisma/schema.prisma',
    desc: 'Prisma ORM schema defining relational models: Users, Roles, Warehouses, Products, Inventory items, Suppliers, and ACID Transactions.'
  },
  {
    category: '2. Database Schema & Data Models',
    path: 'backend/prisma/seed.ts',
    desc: 'Enterprise database seeding script populating 4 regional facilities, 20+ realistic retail SKUs, regional vendors, and demo credentials.'
  },

  // 3. BACKEND API ENGINE
  {
    category: '3. Backend API Engine & Core Services',
    path: 'backend/src/server.ts',
    desc: 'Core Express 5 HTTP & WebSocket server handling pessimistic row locking (SELECT ... FOR UPDATE), RBAC authorization, and analytics.'
  },
  {
    category: '3. Backend API Engine & Core Services',
    path: 'backend/src/lib/redis.ts',
    desc: 'Resilient dual-mode caching layer supporting external Redis clusters with automated failover to high-performance in-memory LRU maps.'
  },
  {
    category: '3. Backend API Engine & Core Services',
    path: 'backend/src/utils/validators.ts',
    desc: 'Zod schema validation definitions for inbound manifest commits, point-of-sale checkout tickets, and product catalog registrations.'
  },
  {
    category: '3. Backend API Engine & Core Services',
    path: 'backend/src/utils/validate.ts',
    desc: 'Express middleware enforcing runtime schema validation and structured error reporting prior to database mutation execution.'
  },

  // 4. FRONTEND STATE, CONTEXT & PROTOCOLS
  {
    category: '4. Frontend State & Architecture',
    path: 'frontend/src/types/index.ts',
    desc: 'Single source of truth TypeScript domain types: UserRole, AuthUser, Product, Warehouse, InventoryItem, and Supplier definitions.'
  },
  {
    category: '4. Frontend State & Architecture',
    path: 'frontend/src/lib/api.ts',
    desc: 'Unified HTTP API client handling JWT authorization headers, environment URL normalization, and fault-tolerant request forwarding.'
  },
  {
    category: '4. Frontend State & Architecture',
    path: 'frontend/src/context/AuthContext.tsx',
    desc: 'React Authentication Context supporting credential verification, Google Single Sign-On, and 1-Click Academic Evaluator Sandbox sessions.'
  },
  {
    category: '4. Frontend State & Architecture',
    path: 'frontend/src/lib/fallbackData.ts',
    desc: 'Embedded enterprise dataset providing seamless offline capability and instant responsiveness during cloud cold-start periods.'
  },

  // 5. FRONTEND APPLICATION PAGES
  {
    category: '5. Frontend UI Modules & Pages',
    path: 'frontend/src/App.tsx',
    desc: 'Root React router configuration orchestrating liquid glass transitions, role-based route guards, and desktop/mobile layout shells.'
  },
  {
    category: '5. Frontend UI Modules & Pages',
    path: 'frontend/src/pages/Login.tsx',
    desc: 'Authentication gateway featuring traditional credentials, Google OAuth SSO, and the Academic Evaluator Sandbox with preset persona selector.'
  },
  {
    category: '5. Frontend UI Modules & Pages',
    path: 'frontend/src/pages/Dashboard.tsx',
    desc: 'Executive Command Center displaying real-time KPI metrics, velocity forecasts, dead-stock aging tiers, and 1-click critical restock actions.'
  },
  {
    category: '5. Frontend UI Modules & Pages',
    path: 'frontend/src/pages/Catalog.tsx',
    desc: 'Master SKU Catalog with live aggregated unit counts, regional hub isolation filters, modal CRUD operations, and optimistic updates.'
  },
  {
    category: '5. Frontend UI Modules & Pages',
    path: 'frontend/src/pages/Network.tsx',
    desc: 'Regional Warehouse Topology interface featuring cubic capacity gauges, utilization alerts, and regional hub deployment controls.'
  },
  {
    category: '5. Frontend UI Modules & Pages',
    path: 'frontend/src/pages/Procurement.tsx',
    desc: 'Inbound Receiving Hub supporting hardware barcode intake (Camera / USB industrial scanner / Keypad) and atomic stock ingestion.'
  },
  {
    category: '5. Frontend UI Modules & Pages',
    path: 'frontend/src/pages/Scanner.tsx',
    desc: 'High-speed Outbound POS Floor Checkout terminal calculating real-time gross margins ($ profit per unit) and serialized stock dispatches.'
  },
  {
    category: '5. Frontend UI Modules & Pages',
    path: 'frontend/src/pages/AccessControl.tsx',
    desc: 'Identity & Access Management (IAM) personnel directory with RBAC security clearance hierarchy and facility assignments.'
  }
];

function generateHtml() {
  let tocHtml = '';
  let sectionsHtml = '';
  let fileIndex = 1;

  for (const item of filesToInclude) {
    const fullPath = path.resolve(item.path);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${item.path}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lineCount = content.split('\n').length;
    const sizeKb = (fs.statSync(fullPath).size / 1024).toFixed(1);

    tocHtml += `
      <tr>
        <td style="font-family: monospace; font-weight: bold; width: 40px;">${fileIndex < 10 ? '0' + fileIndex : fileIndex}</td>
        <td>
          <a href="#file-${fileIndex}" style="color: #0071E3; text-decoration: none; font-weight: 700; font-family: monospace;">${item.path}</a>
          <div style="font-size: 8pt; color: #6E6E73; margin-top: 2px;">${item.desc}</div>
        </td>
        <td style="font-size: 8pt; color: #86868B; text-align: right; width: 80px; font-family: monospace;">${lineCount} lines</td>
        <td style="font-size: 8pt; color: #86868B; text-align: right; width: 70px; font-family: monospace;">${sizeKb} KB</td>
      </tr>
    `;

    // Format code lines
    const lines = content.split('\n');
    const formattedCode = lines.map((line, idx) => {
      const lineNum = idx + 1;
      return `<span class="line-num">${lineNum}</span><span class="line-code">${escapeHtml(line)}</span>`;
    }).join('\n');

    sectionsHtml += `
      <div class="file-section" id="file-${fileIndex}">
        <div class="file-header">
          <div class="file-badge-row">
            <span class="badge badge-num">FILE ${fileIndex} OF ${filesToInclude.length}</span>
            <span class="badge badge-cat">${item.category}</span>
            <span class="badge badge-meta">${lineCount} LINES • ${sizeKb} KB</span>
          </div>
          <h2 class="file-title">${item.path}</h2>
          <p class="file-desc">${item.desc}</p>
        </div>

        <div class="code-container">
          <pre class="code-block">${formattedCode}</pre>
        </div>
      </div>
      <div class="page-break"></div>
    `;

    fileIndex++;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AtomicStock — Complete Source Code Portfolio</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 12mm 15mm 12mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #86868B;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #FFFFFF;
      color: #1D1D1F;
      font-size: 9pt;
      line-height: 1.45;
    }

    .cover-page {
      padding: 40px 30px;
      background: white;
      border: 1px solid #E5E5EA;
      border-radius: 16px;
      margin-bottom: 25px;
      page-break-after: always;
    }

    .header-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #1D1D1F;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }

    .logo-badge {
      display: inline-flex;
      align-items: center;
      background: #1D1D1F;
      color: white;
      padding: 6px 14px;
      border-radius: 10px;
      font-size: 11pt;
      font-weight: 800;
      letter-spacing: -0.3px;
    }

    .meta-tag {
      font-size: 8pt;
      font-weight: 700;
      color: #0071E3;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .main-title {
      font-size: 25pt;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.8px;
      color: #1D1D1F;
      margin: 0 0 8px 0;
    }

    .main-subtitle {
      font-size: 12pt;
      font-weight: 600;
      color: #6E6E73;
      margin: 0 0 22px 0;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      background: #F5F5F7;
      padding: 18px;
      border-radius: 12px;
      border: 1px solid #E5E5EA;
      margin-bottom: 25px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #86868B;
      margin-bottom: 2px;
    }

    .meta-val {
      font-size: 9pt;
      font-weight: 700;
      color: #1D1D1F;
    }

    .meta-mono {
      font-family: "SF Mono", "Courier New", monospace;
      font-size: 8pt;
    }

    .toc-section {
      background: white;
      border: 1px solid #E5E5EA;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
    }

    .toc-title {
      font-size: 11pt;
      font-weight: 800;
      color: #1D1D1F;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    table.toc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }

    table.toc-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #F0F0F2;
      vertical-align: top;
    }

    table.toc-table tr:hover td {
      background-color: #F9FAFB;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
      height: 0;
      margin: 0;
      padding: 0;
    }

    .file-section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .file-header {
      background: #F9FAFB;
      border: 1px solid #E5E5EA;
      border-bottom: none;
      border-radius: 12px 12px 0 0;
      padding: 14px 18px;
    }

    .file-badge-row {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-bottom: 6px;
    }

    .badge {
      font-size: 6.5pt;
      font-weight: 700;
      padding: 2.5px 7px;
      border-radius: 5px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .badge-num {
      background: #1D1D1F;
      color: white;
    }

    .badge-cat {
      background: #EBF5FF;
      color: #0071E3;
    }

    .badge-meta {
      background: #F3F4F6;
      color: #4B5563;
      border: 1px solid #E5E7EB;
    }

    .file-title {
      font-size: 11.5pt;
      font-weight: 800;
      font-family: "SF Mono", "Courier New", monospace;
      color: #1D1D1F;
      margin: 0 0 4px 0;
    }

    .file-desc {
      font-size: 8pt;
      color: #6E6E73;
      margin: 0;
    }

    .code-container {
      background: #FAFAFC;
      border: 1px solid #E5E5EA;
      border-radius: 0 0 12px 12px;
      overflow: hidden;
    }

    .code-block {
      margin: 0;
      padding: 12px 14px;
      font-family: "SF Mono", "Menlo", "Courier New", monospace;
      font-size: 7.2pt;
      line-height: 1.45;
      color: #24292F;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .line-num {
      display: inline-block;
      width: 34px;
      color: #9CA3AF;
      user-select: none;
      text-align: right;
      padding-right: 12px;
      font-size: 6.8pt;
    }

    .line-code {
      display: inline;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="header-banner">
      <div class="logo-badge">ATOMICSTOCK V2.4</div>
      <div class="meta-tag">COMPLETE SOURCE CODE PORTFOLIO</div>
    </div>

    <h1 class="main-title">Full Project Source Code & Software Architecture</h1>
    <h3 class="main-subtitle">Distributed Retail Inventory Management System with Serialized ACID Concurrency</h3>

    <div class="metadata-grid">
      <div class="meta-item">
        <span class="meta-label">Project Title</span>
        <span class="meta-val">AtomicStock Distributed Logistics</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Submission Date</span>
        <span class="meta-val">November 4, 2026</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Primary Stack</span>
        <span class="meta-val meta-mono">TypeScript / Node 20 / React 19 / PostgreSQL 16</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Persistence & ORM</span>
        <span class="meta-val meta-mono">Prisma ORM 6 / ACID Transactions (SELECT FOR UPDATE)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Caching & Telemetry</span>
        <span class="meta-val meta-mono">Redis 7 / In-memory LRU / Socket.IO WebSockets</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Orchestration & Cloud</span>
        <span class="meta-val meta-mono">Docker Compose Prod / Render Cloud Blueprints</span>
      </div>
    </div>

    <div class="toc-section">
      <div class="toc-title">Table of Contents & Manifest of Included Modules</div>
      <table class="toc-table">
        <tbody>
          ${tocHtml}
        </tbody>
      </table>
    </div>
  </div>

  <!-- SOURCE CODE SECTIONS -->
  ${sectionsHtml}

</body>
</html>`;
}

async function run() {
  console.log('📄 Generating Complete Source Code Document...');
  const htmlContent = generateHtml();

  // Save HTML version
  const htmlPath = path.resolve('ATOMICSTOCK_COMPLETE_SOURCE_CODE.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`✅ Saved HTML source code portfolio to ${htmlPath}`);

  // Save Word DOC version
  const docPath = path.resolve('ATOMICSTOCK_COMPLETE_SOURCE_CODE.doc');
  fs.writeFileSync(docPath, htmlContent);
  console.log(`✅ Saved Word DOC source code portfolio to ${docPath}`);

  // Compile PDF via Puppeteer
  console.log('🖨️ Compiling PDF with Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'load', timeout: 90000 });
  await new Promise(r => setTimeout(r, 1500));

  const pdfPath = path.resolve('ATOMICSTOCK_COMPLETE_SOURCE_CODE.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '15mm',
      left: '12mm',
      right: '12mm'
    }
  });

  await browser.close();
  console.log(`🎉 Successfully compiled Complete Source Code PDF to ${pdfPath}`);
}

run().catch(err => {
  console.error('Error generating Source Code PDF:', err);
  process.exit(1);
});
