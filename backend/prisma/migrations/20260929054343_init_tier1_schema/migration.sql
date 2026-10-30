/*
  Warnings:

  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[code]` on the table `Warehouse` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lastSync` to the `Inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Warehouse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT');

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_productId_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_warehouseId_fkey";

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "lastSync" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TxType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_productId_idx" ON "Transaction"("productId");

-- CreateIndex
CREATE INDEX "Transaction_warehouseId_idx" ON "Transaction"("warehouseId");

-- CreateIndex
CREATE INDEX "Transaction_timestamp_idx" ON "Transaction"("timestamp");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_warehouseId_idx" ON "Inventory"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
