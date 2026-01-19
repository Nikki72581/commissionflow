-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('RETURN', 'CLAWBACK', 'OVERRIDE', 'SPLIT_CREDIT');

-- CreateTable
CREATE TABLE "commission_adjustments" (
    "id" TEXT NOT NULL,
    "commissionCalculationId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "AdjustmentType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "relatedTransactionId" TEXT,
    "appliedById" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commission_adjustments_commissionCalculationId_idx" ON "commission_adjustments"("commissionCalculationId");

-- CreateIndex
CREATE INDEX "commission_adjustments_organizationId_idx" ON "commission_adjustments"("organizationId");

-- CreateIndex
CREATE INDEX "commission_adjustments_appliedById_idx" ON "commission_adjustments"("appliedById");

-- CreateIndex
CREATE INDEX "commission_adjustments_type_idx" ON "commission_adjustments"("type");

-- AddForeignKey
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_commissionCalculationId_fkey" FOREIGN KEY ("commissionCalculationId") REFERENCES "commission_calculations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_relatedTransactionId_fkey" FOREIGN KEY ("relatedTransactionId") REFERENCES "sales_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
