CREATE TABLE "NotificationInstallation" (
 "id" TEXT NOT NULL, "accountId" TEXT NOT NULL, "platform" TEXT NOT NULL,
 "target" JSONB NOT NULL, "targetHash" TEXT NOT NULL, "generation" INTEGER NOT NULL DEFAULT 1,
 "revocationHash" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "NotificationInstallation_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "NotificationInstallation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NotificationInstallation_targetHash_key" ON "NotificationInstallation"("targetHash");
CREATE INDEX "NotificationInstallation_accountId_enabled_idx" ON "NotificationInstallation"("accountId", "enabled");
CREATE TABLE "NotificationDelivery" (
 "id" TEXT NOT NULL, "accountId" TEXT NOT NULL, "installationId" TEXT NOT NULL, "generation" INTEGER NOT NULL,
 "eventId" TEXT NOT NULL, "slot" TEXT NOT NULL, "schedule" TEXT NOT NULL, "sourceLineId" TEXT NOT NULL,
 "startDay" TEXT NOT NULL, "eventTitle" TEXT NOT NULL, "dueAt" TIMESTAMP(3) NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'pending', "attempts" INTEGER NOT NULL DEFAULT 0, "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "claimToken" TEXT, "leaseUntil" TIMESTAMP(3), "ticketId" TEXT, "receiptDueAt" TIMESTAMP(3), "lastError" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "NotificationDelivery_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "NotificationInstallation"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NotificationDelivery_logical_endpoint_key" ON "NotificationDelivery"("accountId", "eventId", "slot", "schedule", "installationId");
CREATE INDEX "NotificationDelivery_status_nextAttemptAt_leaseUntil_idx" ON "NotificationDelivery"("status", "nextAttemptAt", "leaseUntil");
CREATE INDEX "NotificationDelivery_receiptDueAt_idx" ON "NotificationDelivery"("receiptDueAt");
CREATE TABLE "NotificationScanState" (
 "id" TEXT NOT NULL, "cursor" JSONB NOT NULL, "leaseToken" TEXT, "leaseUntil" TIMESTAMP(3), "lastSucceededAt" TIMESTAMP(3), "lastReport" JSONB, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "NotificationScanState_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NotificationUsageDay" (
 "id" TEXT NOT NULL, "sourceRequests" INTEGER NOT NULL DEFAULT 0, "sendAttempts" INTEGER NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "NotificationUsageDay_pkey" PRIMARY KEY ("id")
);
-- Tokens and subscription URLs are capabilities. No browser role has policies.
ALTER TABLE "NotificationInstallation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationDelivery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationScanState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationUsageDay" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  REVOKE ALL ON TABLE "NotificationInstallation", "NotificationDelivery", "NotificationScanState", "NotificationUsageDay" FROM anon;
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  REVOKE ALL ON TABLE "NotificationInstallation", "NotificationDelivery", "NotificationScanState", "NotificationUsageDay" FROM authenticated;
 END IF;
END $$;
