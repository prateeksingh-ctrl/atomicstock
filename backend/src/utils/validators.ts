import { z } from 'zod';

// Validates incoming Product creation requests
export const productSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters').toUpperCase(),
  name: z.string().min(2, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
});

// Validates incoming Warehouse creation requests
// FIX: capacity was wrongly capped at max(100) — warehouses can hold 100,000+ units
export const warehouseSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
  name: z.string().min(2, 'Warehouse name is required'),
  location: z.string().min(2, 'Location is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').default(10000),
});

// Validates the batch payload coming from the Floor Scanner
export const scannerBatchSchema = z.object({
  warehouseId: z.string().uuid('Invalid Warehouse ID'),
  items: z.array(
    z.object({
      sku: z.string().toUpperCase(),
      quantity: z.number().int().positive('Quantity must be a positive integer'),
    })
  ).min(1, 'Batch must contain at least one scanned item'),
});

// Validates outbound orders (Checkout / Dispatch)
// Note: orderRef removed — frontend does not send it
export const dispatchSchema = z.object({
  warehouseId: z.string().uuid('Invalid Warehouse ID'),
  sku: z.string().toUpperCase(),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});
