# P_022: Tier-1 Retail Inventory Management System

> **Author:** Prateek Singh  
> **Project Code:** P_022  
> **Status:** Production-Ready & Stress-Tested (500+ Concurrent Requests)

---

## 1. Executive Summary & Problem Statement

Modern high-volume retail and e-commerce platforms operate across decentralized distribution networks (regional hubs and localized fulfillment centers). Traditional inventory management prototypes relying on standard CRUD operations and static access controls fail under two critical failure states:
1. **Race Conditions (Overselling):** Multiple users purchasing the final unit of stock simultaneously bypass application-level checks, resulting in negative database inventory, canceled orders, and lost customer trust[cite: 3, 4].
2. **Security & Data Corruption:** Lack of atomic rollback mechanisms means partial scanner data can corrupt stock levels, while static user roles fail to restrict sensitive floor operations[cite: 3, 4].

**Project P_022** engineers an enterprise-grade, ACID-compliant inventory platform utilizing pessimistic row-level locking, atomic transaction rollbacks, a Dynamic Role-Based Access Control (RBAC) engine, and a high-density Apple-inspired UI to guarantee 100% data integrity under heavy concurrent load[cite: 3, 4].

---

## 2. Core Business Use Cases

* **UC-01: High-Concurrency Flash Sale (Pessimistic Locking)**[cite: 3, 4]
  * *Scenario:* Multiple checkout requests hit the database simultaneously for the last remaining SKU[cite: 3, 4].
  * *Outcome:* The database enforces a `SELECT ... FOR UPDATE` lock[cite: 3, 4]. The first transaction succeeds; subsequent transactions are gracefully rejected with `INSUFFICIENT_STOCK` (HTTP 409 Conflict)[cite: 3, 4].
* **UC-02: Floor Scanner Atomic Ingestion**[cite: 3, 4]
  * *Scenario:* A warehouse operator scans a batch of items where one SKU is unrecognized[cite: 3, 4].
  * *Outcome:* The system intercepts the bad SKU and triggers a complete database rollback, ensuring zero partial data corruption[cite: 3, 4].
* **UC-03: Dynamic Personnel Provisioning (RBAC & IAM)**[cite: 3, 4]
  * *Scenario:* A new employee logs in via Google OAuth but lacks clearance[cite: 3, 4].
  * *Outcome:* The system intercepts them in a "Waiting Room" (`PENDING` status) until an Admin explicitly assigns their role and physical node location[cite: 3, 4].
* **UC-04: Multi-Node Stock Distribution**[cite: 3, 4]
  * *Scenario:* Viewing and managing aggregate stock spread across geographically distinct warehouses[cite: 3, 4].
  * *Outcome:* Real-time UI reflects total catalog availability versus localized warehouse capacity limits[cite: 3, 4].

---

## 3. System Architecture & Tech Stack

The application is built on a modern decoupled architecture using the following technology stack[cite: 3, 4]:

| Layer | Technology | Version | Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React.js | v18.x[cite: 3, 4] | Component-based UI for dynamic dashboard rendering[cite: 3, 4]. |
| **Build Tool** | Vite | v5.x[cite: 3, 4] | High-performance Hot Module Replacement (HMR) and bundling[cite: 3, 4]. |
| **Styling** | Tailwind CSS | v4.x[cite: 3, 4] | Utility-first styling for enterprise-grade, responsive UI[cite: 3, 4]. |
| **Backend Environment** | Node.js | v22.12.0[cite: 3, 4] | High-throughput asynchronous runtime environment[cite: 3, 4]. |
| **API Framework** | Express.js | v4.x[cite: 3, 4] | Lightweight, robust routing for RESTful architecture[cite: 3, 4]. |
| **TypeScript Engine** | tsx | Latest[cite: 3, 4] | Native execution of TypeScript in Node without legacy build steps[cite: 3, 4]. |
| **Database ORM** | Prisma | v6.19.3[cite: 3, 4] | Type-safe queries, automatic migrations, and transaction mapping[cite: 3, 4]. |
| **Database Engine** | PostgreSQL | v15/16[cite: 3, 4] | Strict ACID compliance, relational integrity, and row-level locking[cite: 3, 4]. |
| **Caching Engine** | Redis | Latest | Sub-millisecond catalog query acceleration and pub/sub caching. |
| **Security & IAM** | Google Auth & Zod | Latest[cite: 3, 4] | OAuth 2.0 verification and strict edge-level payload validation[cite: 3, 4]. |

---

## 4. How We Built It From Scratch (Step-by-Step Implementation)

### A. Database Schema & Relational Integrity (Prisma & PostgreSQL)
Designed a normalized relational model consisting of five core entities:
* **`User` & `Role`:** Implements granular RBAC permissions (`GLOBAL_ADMIN`, `NODE_MANAGER`, `INBOUND_SPECIALIST`, `OUTBOUND_SPECIALIST`, `INVENTORY_AUDITOR`, and `UNASSIGNED`) linked to specific warehouse nodes[cite: 3, 4].
* **`Product` & `Warehouse`:** Master catalog items mapped to multi-node physical distribution centers[cite: 3, 4].
* **`Inventory`:** Junction table tracking precise quantities per SKU per warehouse[cite: 3, 4].

### B. Concurrency & ACID Concurrency Control (UC-01)
To prevent race conditions during high-volume sales, the backend utilizes Prisma raw queries with explicit PostgreSQL row locking:
```typescript
const inventory = await tx.$queryRaw<any[]>`
  SELECT * FROM "Inventory" 
  WHERE "productId" = ${product.id} AND "warehouseId" = ${warehouseId} 
  FOR UPDATE
`;

//This halts parallel transactions attempting to access the same inventory record, allowing only one transaction to decrement stock while others fail gracefully when stock hits zero[cite: 3, 4].C. Enterprise Security & Waiting Room IAM WorkflowAuthentication is handled via Google OAuth 2.0 (Google Identity Services).   Upon initial sign-in, non-admin users are assigned an UNASSIGNED role and a PENDING status, routing them directly to a secure lock screen ("Waiting Room").   Administrators utilize the Access Control Panel to review pending personnel, assign regional node clearance, promote roles, and authorize active platform access[cite: 4].D. Hardware-Integrated Floor TerminalOptimized for high-speed warehouse operations with automated useRef focus binding for physical USB/Bluetooth barcode scanner guns[cite: 4].Includes live HTML5 browser camera scanning capabilities for rapid batch ingestion and dispatch verification[cite: 3, 4].E. Apple-Inspired High-Density UI & Design SystemEngineered a sleek, modern interface mirroring Apple's Cupertino design language (#F5F5F7 canvas, #1D1D1F charcoal typography, and system blue #0071E3 accents)[cite: 4].Designed zero-whitespace high-density frosted-glass data cards (backdrop-blur-2xl) packed with real-time WebSocket telemetry (socket.io)[cite: 4].5. Verification & Stress TestingThe system underwent rigorous automated stress testing simulating 500 simultaneous checkout requests hitting a single SKU containing exactly 1 unit of stock[cite: 3, 4]:Result: 1 successful transaction committed; 499 concurrent requests gracefully rejected with 409 Conflict (Out of Stock)[cite: 4].Database State: Final inventory quantity verified at exactly 0 (Zero negative stock conditions or race conditions detected)[cite: 3, 4].6. Local Installation & SetupClone the Repository:Bashgit clone [https://github.com/your-username/p_022_inventory.git](https://github.com/your-username/p_022_inventory.git)
//cd p_022_inventory//
//Backend Setup:Bashcd backend
(npm install
Create a .env file in the backend directory:Code snippetDATABASE_URL="postgresql://user:password@localhost:5432/p_022_db?schema=public"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
SUPER_ADMIN_EMAIL="your.admin.email@gmail.com"
JWT_SECRET="your-secure-jwt-secret"
PORT=3000
Run database migrations and start the server:Bashnpx prisma migrate dev
npm run dev
Frontend Setup:Open a new terminal window:Bashcd frontend
npm install
Create a .env file in the frontend directory:Code snippetVITE_GOOGLE_CLIENT_ID="your-google-oauth-client-id"
Start the development server:Bashnpm run dev//
Developed as part of the P_022 Enterprise Systems Engineering Capstone. //)