CREATE TABLE "WhatsAppChatbotSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "customerId" TEXT,
    "step" TEXT NOT NULL DEFAULT 'MENU',
    "data" TEXT,
    "lastInboundMessageId" TEXT,
    "lastOutboundAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppChatbotSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppChatbotSession_phone_key"
ON "WhatsAppChatbotSession"("phone");

CREATE UNIQUE INDEX "WhatsAppChatbotSession_lastInboundMessageId_key"
ON "WhatsAppChatbotSession"("lastInboundMessageId");

CREATE INDEX "WhatsAppChatbotSession_step_updatedAt_idx"
ON "WhatsAppChatbotSession"("step", "updatedAt");

CREATE INDEX "WhatsAppChatbotSession_expiresAt_idx"
ON "WhatsAppChatbotSession"("expiresAt");
