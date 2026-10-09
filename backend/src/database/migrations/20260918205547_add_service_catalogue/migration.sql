-- AlterEnum
ALTER TYPE "ServiceType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "OrderServiceLine" ADD COLUMN     "serviceTypeSnapshot" "ServiceType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "ServiceJob" ADD COLUMN     "serviceNames" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ServiceCatalogueItem" (
    "id" UUID NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sellingPricePaise" INTEGER NOT NULL,
    "gstRateBasisPoints" INTEGER NOT NULL DEFAULT 1800,
    "createsServiceJob" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCatalogueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCatalogueItem_serviceId_key" ON "ServiceCatalogueItem"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceCatalogueItem_serviceType_idx" ON "ServiceCatalogueItem"("serviceType");

-- CreateIndex
CREATE INDEX "ServiceCatalogueItem_isActive_idx" ON "ServiceCatalogueItem"("isActive");
