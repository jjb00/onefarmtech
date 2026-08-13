ALTER TABLE "GroupBuyReservation" ADD COLUMN "email" TEXT;
ALTER TABLE "GroupBuyReservation" ADD COLUMN "unitPrice" INTEGER NOT NULL DEFAULT 0;

UPDATE "GroupBuyReservation"
SET "unitPrice" = CASE
  WHEN "quantity" > 0 THEN ROUND("amount"::numeric / "quantity")::integer
  ELSE 0
END
WHERE "unitPrice" = 0;

CREATE TABLE "GroupBuyPaymentRequest" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'Paystack',
    "reference" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'Initialising',
    "paymentUrl" TEXT,
    "gatewayReference" TEXT,
    "providerTransactionId" TEXT,
    "providerHttpStatus" INTEGER,
    "providerError" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupBuyPaymentRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupBuyPaymentRequest_reference_key" ON "GroupBuyPaymentRequest"("reference");
CREATE INDEX "GroupBuyPaymentRequest_reservationId_createdAt_idx" ON "GroupBuyPaymentRequest"("reservationId", "createdAt");

ALTER TABLE "GroupBuyPaymentRequest"
ADD CONSTRAINT "GroupBuyPaymentRequest_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "GroupBuyReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
