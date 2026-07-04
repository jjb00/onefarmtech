-- CreateTable
CREATE TABLE "BuyerContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Buyer user',
    "canPlaceOrders" BOOLEAN NOT NULL DEFAULT true,
    "canViewReceipts" BOOLEAN NOT NULL DEFAULT true,
    "canViewCredit" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerAccountInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Buyer user',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "expiresAt" DATETIME,
    "sentAt" DATETIME,
    "acceptedAt" DATETIME,
    "createdBy" TEXT NOT NULL DEFAULT 'Local staff user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerAccountInvite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BuyerAccountInvite_inviteCode_key" ON "BuyerAccountInvite"("inviteCode");
