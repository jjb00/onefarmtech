-- Product: distinguish stocked staples (fulfil same/next-day) from the
-- default fresh-sourced items (need the usual 1-2 day farm sourcing lead
-- time). Used to set realistic fulfilment expectations in the WhatsApp
-- ordering flow.
ALTER TABLE "Product" ADD COLUMN "stockType" TEXT NOT NULL DEFAULT 'Fresh sourced';

-- Best-effort backfill for the staple items already effectively stocked.
-- Safe to re-adjust per product afterwards from the admin product list.
UPDATE "Product"
SET "stockType" = 'Stocked'
WHERE "name" ILIKE '%potato%' OR "name" ILIKE '%onion%';

-- Per-phone-number cart/step state for the interactive WhatsApp ordering
-- flow (buttons/lists), separate from WhatsAppChatbotSession which the
-- prior text-menu chatbot used. Inbound webhooks are stateless HTTP calls,
-- so this is what lets a conversation resume across separate requests.
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
