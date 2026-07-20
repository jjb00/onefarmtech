CREATE TABLE "PublicIntakeDedupe" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicIntakeDedupe_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicIntakeDedupe_dedupeKey_key" ON "PublicIntakeDedupe"("dedupeKey");
CREATE INDEX "PublicIntakeDedupe_createdAt_idx" ON "PublicIntakeDedupe"("createdAt");
