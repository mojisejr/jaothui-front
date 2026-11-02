BEGIN;
-- CreateTable
CREATE TABLE "WebBrowserSession" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "credentialHash" TEXT NOT NULL,
    "credentialKind" TEXT NOT NULL,
    "credentialSubject" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebBrowserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebEventGrant" (
    "id" TEXT NOT NULL,
    "browserId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebEventGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebEventSession" (
    "id" TEXT NOT NULL,
    "browserId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebEventSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebLineAttachIntent" (
    "id" TEXT NOT NULL,
    "browserId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "returnTo" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "verifiedProfile" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebLineAttachIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebBrowserSession_accountId_idx" ON "WebBrowserSession"("accountId");

-- CreateIndex
CREATE INDEX "WebEventGrant_browserId_idx" ON "WebEventGrant"("browserId");

-- CreateIndex
CREATE INDEX "WebEventSession_browserId_idx" ON "WebEventSession"("browserId");

-- CreateIndex
CREATE INDEX "WebLineAttachIntent_browserId_idx" ON "WebLineAttachIntent"("browserId");

-- AddForeignKey
ALTER TABLE "WebBrowserSession" ADD CONSTRAINT "WebBrowserSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebEventGrant" ADD CONSTRAINT "WebEventGrant_browserId_fkey" FOREIGN KEY ("browserId") REFERENCES "WebBrowserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebEventSession" ADD CONSTRAINT "WebEventSession_browserId_fkey" FOREIGN KEY ("browserId") REFERENCES "WebBrowserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebLineAttachIntent" ADD CONSTRAINT "WebLineAttachIntent_browserId_fkey" FOREIGN KEY ("browserId") REFERENCES "WebBrowserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "WebBrowserSession" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "WebBrowserSession" FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON TABLE "WebBrowserSession" FROM %I',r); END IF;
END LOOP; END $$;

ALTER TABLE "WebEventGrant" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "WebEventGrant" FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON TABLE "WebEventGrant" FROM %I',r); END IF;
END LOOP; END $$;

ALTER TABLE "WebEventSession" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "WebEventSession" FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON TABLE "WebEventSession" FROM %I',r); END IF;
END LOOP; END $$;

ALTER TABLE "WebLineAttachIntent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "WebLineAttachIntent" FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON TABLE "WebLineAttachIntent" FROM %I',r); END IF;
END LOOP; END $$;
COMMIT;
