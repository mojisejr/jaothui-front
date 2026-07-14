-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "avatar" TEXT,
    "name" TEXT,
    "farmName" TEXT,
    "wallet" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "lineId" TEXT,
    "email" TEXT,
    "tel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "approved" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT DEFAULT '/images/thuiLogo.png',
    "description" TEXT,
    "tel" TEXT,
    "websiteUrl" TEXT,
    "facebook" TEXT,
    "twitter" TEXT,
    "locationUrl" TEXT,
    "userId" INTEGER,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "wallet" TEXT NOT NULL,
    "isLifeTime" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end" TIMESTAMP(3),
    "slipUrl" TEXT NOT NULL,
    "approver" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "rejector" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER,
    "currentStep" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedigree" (
    "microchip" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "certNo" TEXT,
    "birthday" TIMESTAMP(3) NOT NULL,
    "sex" TEXT NOT NULL,
    "motherId" TEXT,
    "fatherId" TEXT,
    "origin" TEXT DEFAULT 'thai',
    "height" INTEGER DEFAULT 0,
    "color" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "dna" TEXT NOT NULL,
    "image" TEXT,
    "rarity" TEXT NOT NULL DEFAULT 'Normal',
    "tokenId" BIGINT NOT NULL,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "Pedigree_pkey" PRIMARY KEY ("microchip")
);

-- CreateTable
CREATE TABLE "Advertisements" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Microchip" (
    "id" SERIAL NOT NULL,
    "microchip" TEXT NOT NULL,
    "tokenId" TEXT,
    "sold" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Microchip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicrochipOrder" (
    "id" SERIAL NOT NULL,
    "microchipId" TEXT,
    "wallet" TEXT NOT NULL,
    "farmId" INTEGER,
    "shippingAddress" TEXT,
    "slipUrl" TEXT,
    "note" TEXT,
    "approver" TEXT[],
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "canMint" BOOLEAN NOT NULL DEFAULT false,
    "minted" BOOLEAN NOT NULL DEFAULT false,
    "shipped" BOOLEAN NOT NULL DEFAULT false,
    "buffaloName" TEXT NOT NULL,
    "buffaloOrigin" TEXT NOT NULL,
    "buffaloBirthday" TEXT NOT NULL,
    "buffaloColor" TEXT NOT NULL,
    "buffaloSex" TEXT NOT NULL,
    "buffaloHeight" TEXT NOT NULL,
    "buffaloipfsUrl" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MicrochipOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "microchip" TEXT NOT NULL,
    "no" SERIAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bornAt" TEXT DEFAULT 'N/A',
    "wallet" TEXT NOT NULL,
    "slipUrl" TEXT NOT NULL,
    "dadId" TEXT,
    "fGranDadId" TEXT,
    "fGrandMomId" TEXT,
    "mGrandDadId" TEXT,
    "mGrandMomId" TEXT,
    "momId" TEXT,
    "ownerName" TEXT NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("microchip")
);

-- CreateTable
CREATE TABLE "CertificateApprover" (
    "wallet" TEXT NOT NULL,
    "signatureUrl" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CertificateApprover_pkey" PRIMARY KEY ("wallet")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "microchip" TEXT NOT NULL,
    "rewardImage" TEXT,
    "eventName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "rewardName" TEXT NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CertificateToCertificateApprover" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_key" ON "User"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "User_lineId_key" ON "User"("lineId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedigree_microchip_key" ON "Pedigree"("microchip");

-- CreateIndex
CREATE UNIQUE INDEX "Microchip_microchip_key" ON "Microchip"("microchip");

-- CreateIndex
CREATE UNIQUE INDEX "Microchip_tokenId_key" ON "Microchip"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "MicrochipOrder_microchipId_key" ON "MicrochipOrder"("microchipId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_microchip_key" ON "Certificate"("microchip");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateApprover_wallet_key" ON "CertificateApprover"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "_CertificateToCertificateApprover_AB_unique" ON "_CertificateToCertificateApprover"("A", "B");

-- CreateIndex
CREATE INDEX "_CertificateToCertificateApprover_B_index" ON "_CertificateToCertificateApprover"("B");

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicrochipOrder" ADD CONSTRAINT "MicrochipOrder_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicrochipOrder" ADD CONSTRAINT "MicrochipOrder_microchipId_fkey" FOREIGN KEY ("microchipId") REFERENCES "Microchip"("microchip") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicrochipOrder" ADD CONSTRAINT "MicrochipOrder_wallet_fkey" FOREIGN KEY ("wallet") REFERENCES "User"("wallet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_wallet_fkey" FOREIGN KEY ("wallet") REFERENCES "User"("wallet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateApprover" ADD CONSTRAINT "CertificateApprover_wallet_fkey" FOREIGN KEY ("wallet") REFERENCES "User"("wallet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_microchip_fkey" FOREIGN KEY ("microchip") REFERENCES "Pedigree"("microchip") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CertificateToCertificateApprover" ADD CONSTRAINT "_CertificateToCertificateApprover_A_fkey" FOREIGN KEY ("A") REFERENCES "Certificate"("microchip") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CertificateToCertificateApprover" ADD CONSTRAINT "_CertificateToCertificateApprover_B_fkey" FOREIGN KEY ("B") REFERENCES "CertificateApprover"("wallet") ON DELETE CASCADE ON UPDATE CASCADE;

