CREATE TABLE "GroupBuyPriceTier" (
    "id" TEXT NOT NULL,
    "groupBuyId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupBuyPriceTier_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GroupBuyPriceTier" ADD CONSTRAINT "GroupBuyPriceTier_groupBuyId_fkey" FOREIGN KEY ("groupBuyId") REFERENCES "GroupBuy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "GroupBuyPriceTier_groupBuyId_idx" ON "GroupBuyPriceTier"("groupBuyId");
