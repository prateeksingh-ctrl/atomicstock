// Shared type definitions — single source of truth for AtomicStock frontend

export type UserRole =
  | 'GLOBAL_ADMIN'
  | 'NODE_MANAGER'
  | 'INBOUND_SPECIALIST'
  | 'OUTBOUND_SPECIALIST'
  | 'INVENTORY_AUDITOR'
  | 'UNASSIGNED';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: string;
  createdAt: string;
  updatedAt: string;
  inventory: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  quantity: number;
  productId: string;
  warehouseId: string;
  lastSync?: string;
  product: Product;
  warehouse: Warehouse;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  inventory: InventoryItem[];
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contact: string;
  warehouseId: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: UserRole;
  permissions: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  picture?: string;
  role: UserRole;
  status: UserStatus;
  warehouseId?: string | null;
}
