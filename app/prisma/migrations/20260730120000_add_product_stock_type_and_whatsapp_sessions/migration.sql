-- Product: distinguish stocked staples (fulfil same/next-day) from the
-- default fresh-sourced items (need the usual 1-2 day farm sourcing lead
-- time). Used to set realistic auto-confirmed fulfilment expectations.
ALTER TABLE "Product" ADD COLUMN "stockType" TEXT NOT NULL DEFAULT 'Fresh sourced';

-- Best-effort backfill for the staple items called out as already stocked.
-- Safe to re-adjust per product afterwards from the admin product list.
UPDATE "Product"
SET "stockType" = 'Stocked'
WHERE "name" ILIKE '%potato%' OR "name" ILIKE '%onion%';

-- Per-phone-number cart/step state for the WhatsApp interactive ordering
-- flow, since inbound webhooks are stateless HTTP calls.
CREATE TABLE "WhatsAppOrderSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "step" TEXT NOT NULL DEFAULT 'browsing',
    "cart" TEXT NOT NULL DEFAULT '[]',
    "pendingProductId" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppOrderSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppOrderSession_phone_key" ON "WhatsAppOrderSession"("phone");
CREATE INDEX "WhatsAppOrderSession_expiresAt_idx" ON "WhatsAppOrderSession"("expiresAt");

-- Tracks the last automated payment-reminder send per payment request so
-- the scheduled reconciliation job doesn't re-notify too often.
ALTER TABLE "PaymentRequest" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
