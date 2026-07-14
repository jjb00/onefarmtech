ALTER TABLE "EmailDelivery"
ADD COLUMN "textBody" TEXT NOT NULL DEFAULT '',
ADD COLUMN "htmlBody" TEXT NOT NULL DEFAULT '',
ADD COLUMN "latestEventId" TEXT,
ADD COLUMN "latestEventType" TEXT,
ADD COLUMN "latestEventAt" TIMESTAMP(3),
ADD COLUMN "eventMetadata" TEXT,
ADD COLUMN "nextRetryAt" TIMESTAMP(3);

ALTER TABLE "EmailDelivery"
ALTER COLUMN "textBody" DROP DEFAULT,
ALTER COLUMN "htmlBody" DROP DEFAULT;

ALTER TABLE "PaymentReconciliationIncident"
ADD COLUMN "resolutionNote" TEXT,
ADD COLUMN "resolvedByName" TEXT,
ADD COLUMN "resolvedByEmail" TEXT,
ADD COLUMN "resolvedAt" TIMESTAMP(3);

CREATE TABLE "OperationalEvent" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'Error',
    "summary" TEXT NOT NULL,
    "route" TEXT,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OperationalEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailProviderEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "emailDeliveryId" TEXT,
    "providerMessageId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventAt" TIMESTAMP(3) NOT NULL,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailProviderEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailDelivery_latestEventId_key" ON "EmailDelivery"("latestEventId");
CREATE UNIQUE INDEX "EmailProviderEvent_eventId_key" ON "EmailProviderEvent"("eventId");
CREATE INDEX "EmailProviderEvent_providerMessageId_eventAt_idx" ON "EmailProviderEvent"("providerMessageId", "eventAt");
CREATE INDEX "EmailProviderEvent_emailDeliveryId_eventAt_idx" ON "EmailProviderEvent"("emailDeliveryId", "eventAt");
ALTER TABLE "EmailProviderEvent" ADD CONSTRAINT "EmailProviderEvent_emailDeliveryId_fkey" FOREIGN KEY ("emailDeliveryId") REFERENCES "EmailDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "OperationalEvent_status_createdAt_idx" ON "OperationalEvent"("status", "createdAt");
CREATE INDEX "OperationalEvent_category_createdAt_idx" ON "OperationalEvent"("category", "createdAt");
