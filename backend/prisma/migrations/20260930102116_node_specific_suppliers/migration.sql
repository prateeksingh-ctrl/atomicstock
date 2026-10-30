/*
  Warnings:

  - You are about to drop the column `rating` on the `Supplier` table. All the data in the column will be lost.
  - Added the required column `warehouseId` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Supplier_code_key";

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "rating",
ADD COLUMN     "warehouseId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
