-- BFF-only durable one-shot state. Apply to production only in a reviewed rollout.
CREATE TABLE "MobileLineLinkIntent" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "accountId" TEXT NOT NULL,
 "purpose" TEXT NOT NULL,
 "returnIntent" JSONB NOT NULL,
 "stateNonceHash" TEXT NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "callbackClaimedAt" TIMESTAMP(3),
 "handoffHash" TEXT,
 "verifiedProfile" JSONB,
 "consumedAt" TIMESTAMP(3),
 "redeemedAt" TIMESTAMP(3),
 "linkedIdentityHash" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "MobileLineLinkIntent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MobileLineLinkIntent_handoffHash_key" ON "MobileLineLinkIntent"("handoffHash");
CREATE INDEX "MobileLineLinkIntent_accountId_expiresAt_idx" ON "MobileLineLinkIntent"("accountId", "expiresAt");
