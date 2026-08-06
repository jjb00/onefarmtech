ALTER TABLE "BuyerOtpChallenge" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "BuyerOtpChallenge" ADD COLUMN "recipientPhone" TEXT;
ALTER TABLE "BuyerOtpChallenge" ALTER COLUMN "recipientEmail" DROP NOT NULL;

CREATE INDEX "BuyerOtpChallenge_recipientPhone_createdAt_idx"
ON "BuyerOtpChallenge"("recipientPhone", "createdAt");
