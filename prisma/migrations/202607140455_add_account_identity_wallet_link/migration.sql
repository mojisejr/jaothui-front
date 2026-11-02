-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountIdentity" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletLink" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'bitkub-next',
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'LINKED',
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "WalletLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountIdentity_accountId_idx" ON "AccountIdentity"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountIdentity_provider_providerUserId_key" ON "AccountIdentity"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletLink_walletAddress_key" ON "WalletLink"("walletAddress");

-- CreateIndex
CREATE INDEX "WalletLink_accountId_idx" ON "WalletLink"("accountId");

-- AddForeignKey
ALTER TABLE "AccountIdentity" ADD CONSTRAINT "AccountIdentity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLink" ADD CONSTRAINT "WalletLink_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

