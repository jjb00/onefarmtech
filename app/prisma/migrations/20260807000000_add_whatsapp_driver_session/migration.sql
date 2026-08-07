CREATE TABLE "WhatsAppDriverSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "step" TEXT NOT NULL DEFAULT 'MENU',
    "deliveryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppDriverSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppDriverSession_phone_key" ON "WhatsAppDriverSession"("phone");

CREATE INDEX "WhatsAppDriverSession_expiresAt_idx" ON "WhatsAppDriverSession"("expiresAt");
