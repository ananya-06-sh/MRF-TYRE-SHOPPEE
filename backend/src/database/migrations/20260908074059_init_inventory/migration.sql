-- CreateEnum
CREATE TYPE "TyreCategory" AS ENUM ('TWO_WHEELER', 'PASSENGER_CAR', 'COMMERCIAL');

-- CreateTable
CREATE TABLE "inventory_items" (
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
    "sellingPricePaise" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_productId_key" ON "inventory_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_billingMatchKey_key" ON "inventory_items"("billingMatchKey");

-- CreateIndex
CREATE INDEX "inventory_items_normalizedSize_idx" ON "inventory_items"("normalizedSize");

-- CreateIndex
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");

-- CreateIndex
CREATE INDEX "inventory_items_currentStock_idx" ON "inventory_items"("currentStock");
