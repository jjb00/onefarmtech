CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "provider" TEXT NOT NULL DEFAULT 'Resend',
    "providerMessageId" TEXT,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "lastError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentReconciliationIncident" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "internalReference" TEXT,
    "providerReference" TEXT,
    "reason" TEXT NOT NULL,
    "payloadMetadata" TEXT,
    "verificationMetadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentReconciliationIncident_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailDelivery_deduplicationKey_key" ON "EmailDelivery"("deduplicationKey");
CREATE INDEX "EmailDelivery_status_createdAt_idx" ON "EmailDelivery"("status", "createdAt");
CREATE INDEX "EmailDelivery_relatedType_relatedId_idx" ON "EmailDelivery"("relatedType", "relatedId");
CREATE INDEX "PaymentReconciliationIncident_provider_internalReference_idx" ON "PaymentReconciliationIncident"("provider", "internalReference");
CREATE INDEX "PaymentReconciliationIncident_status_createdAt_idx" ON "PaymentReconciliationIncident"("status", "createdAt");
