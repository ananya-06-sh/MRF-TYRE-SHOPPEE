-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CONFIRMED', 'TALLY_SYNCED', 'CANCELLED');

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "orderId" UUID;

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "billNumber" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdById" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "customerName" TEXT,
    "customerMobile" TEXT,
    "vehiclePlateNumber" TEXT,
    "vehicleModel" TEXT,
    "productsTotalPaise" INTEGER NOT NULL,
    "serviceTotalPaise" INTEGER NOT NULL,
    "includedTaxPaise" INTEGER NOT NULL,
    "grandTotalPaise" INTEGER NOT NULL,
    "tallyVoucherId" TEXT,
    "tallySyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "inventoryItemId" UUID NOT NULL,
    "productIdSnapshot" TEXT NOT NULL,
    "billingMatchKeySnapshot" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "standardUnitPricePaise" INTEGER NOT NULL,
    "billedUnitPricePaise" INTEGER NOT NULL,
    "gstRateBasisPoints" INTEGER NOT NULL,
    "includedTaxPaise" INTEGER NOT NULL,
    "lineTotalPaise" INTEGER NOT NULL,
    "baseCostPaiseSnapshot" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderServiceLine" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "serviceIdSnapshot" TEXT NOT NULL,
    "serviceNameSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "standardUnitPricePaise" INTEGER NOT NULL,
    "billedUnitPricePaise" INTEGER NOT NULL,
    "gstRateBasisPoints" INTEGER NOT NULL,
    "includedTaxPaise" INTEGER NOT NULL,
    "lineTotalPaise" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderServiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_billNumber_key" ON "Order"("billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_createdById_createdAt_idx" ON "Order"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_inventoryItemId_idx" ON "OrderItem"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_inventoryItemId_key" ON "OrderItem"("orderId", "inventoryItemId");

-- CreateIndex
CREATE INDEX "OrderServiceLine_orderId_idx" ON "OrderServiceLine"("orderId");

-- CreateIndex
CREATE INDEX "StockMovement_orderId_idx" ON "StockMovement"("orderId");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderServiceLine" ADD CONSTRAINT "OrderServiceLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
