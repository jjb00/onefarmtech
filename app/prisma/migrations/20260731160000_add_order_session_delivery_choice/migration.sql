-- Track the buyer's chosen delivery method (and pickup location, if
-- applicable) mid-flow, before the order is actually created at checkout.
ALTER TABLE "WhatsAppOrderSession" ADD COLUMN "pendingDeliveryMethod" TEXT;
ALTER TABLE "WhatsAppOrderSession" ADD COLUMN "pendingPickupLocationId" TEXT;
