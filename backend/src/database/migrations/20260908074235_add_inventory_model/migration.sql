/*
  Warnings:

  - You are about to drop the `inventory_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "inventory_items";

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" UUID NOT NULL,
    "productId" TEXT NOT NULL,
    "billingMatchKey" TEXT NOT NULL,
    "patternAndSize" TEXT NOT NULL,
    "normalizedSize" TEXT NOT NULL,
    "category" "TyreCategory" NOT NULL,
    "compatibleVehicles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "lowStockTrigger" INTEGER NOT NULL DEFAULT 4,
    "baseCostPaise" INTEGER NOT NULL,
    "gstRateBasisPoints" INTEGER NOT NULL DEFAULT 2800,
    "finalSellingPricePaise" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_productId_key" ON "InventoryItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_billingMatchKey_key" ON "InventoryItem"("billingMatchKey");

-- CreateIndex
CREATE INDEX "InventoryItem_normalizedSize_idx" ON "InventoryItem"("normalizedSize");

-- CreateIndex
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");

-- CreateIndex
CREATE INDEX "InventoryItem_currentStock_idx" ON "InventoryItem"("currentStock");
