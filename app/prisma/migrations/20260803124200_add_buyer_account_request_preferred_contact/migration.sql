-- Buyers should be able to say whether they want to be reached (and
-- receive their login access) by email or WhatsApp, instead of the
-- account-approval flow assuming email for everyone.
ALTER TABLE "BuyerAccountRequest" ADD COLUMN IF NOT EXISTS "preferredContact" TEXT NOT NULL DEFAULT 'Email';
