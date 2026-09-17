-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('ALIGNMENT', 'BALANCING', 'BOTH');

-- CreateEnum
CREATE TYPE "ServiceJobStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "ServiceJob" (
    "id" UUID NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "orderId" UUID,
    "createdById" UUID NOT NULL,
    "vehiclePlateNumber" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "assignedTechnician" TEXT,
    "status" "ServiceJobStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceJob_jobNumber_key" ON "ServiceJob"("jobNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceJob_orderId_key" ON "ServiceJob"("orderId");

-- CreateIndex
CREATE INDEX "ServiceJob_status_idx" ON "ServiceJob"("status");

-- CreateIndex
CREATE INDEX "ServiceJob_createdById_idx" ON "ServiceJob"("createdById");

-- CreateIndex
CREATE INDEX "ServiceJob_createdAt_idx" ON "ServiceJob"("createdAt");

-- CreateIndex
CREATE INDEX "ServiceJob_vehiclePlateNumber_idx" ON "ServiceJob"("vehiclePlateNumber");

-- AddForeignKey
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
