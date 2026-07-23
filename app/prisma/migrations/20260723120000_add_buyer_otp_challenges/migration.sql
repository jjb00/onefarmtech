CREATE TABLE "BuyerOtpChallenge" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "customerId" TEXT,
    "buyerContactId" TEXT,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "requestIpHash" TEXT,
    "requestMetadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerOtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BuyerOtpChallenge_recipientEmail_createdAt_idx"
ON "BuyerOtpChallenge"("recipientEmail", "createdAt");

CREATE INDEX "BuyerOtpChallenge_requestIpHash_createdAt_idx"
ON "BuyerOtpChallenge"("requestIpHash", "createdAt");

CREATE INDEX "BuyerOtpChallenge_buyerContactId_createdAt_idx"
ON "BuyerOtpChallenge"("buyerContactId", "createdAt");

CREATE INDEX "BuyerOtpChallenge_expiresAt_idx"
ON "BuyerOtpChallenge"("expiresAt");

ALTER TABLE "BuyerOtpChallenge"
ADD CONSTRAINT "BuyerOtpChallenge_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BuyerOtpChallenge"
ADD CONSTRAINT "BuyerOtpChallenge_buyerContactId_fkey"
FOREIGN KEY ("buyerContactId") REFERENCES "BuyerContact"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
