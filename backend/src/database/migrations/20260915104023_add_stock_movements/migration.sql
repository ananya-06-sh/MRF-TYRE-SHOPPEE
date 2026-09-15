-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('OPENING_STOCK', 'STOCK_IN', 'SALE', 'CUSTOMER_RETURN', 'SUPPLIER_RETURN', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" UUID NOT NULL,
    "inventoryItemId" UUID NOT NULL,
    "performedById" UUID NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "stockBefore" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "unitCostPaise" INTEGER,
    "supplierName" TEXT,
    "referenceNumber" TEXT,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockMovement_inventoryItemId_occurredAt_idx" ON "StockMovement"("inventoryItemId", "occurredAt");

-- CreateIndex
CREATE INDEX "StockMovement_performedById_idx" ON "StockMovement"("performedById");

-- CreateIndex
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
