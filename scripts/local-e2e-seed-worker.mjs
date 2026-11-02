import {
  LOCAL_E2E_FIXTURE,
  assertSyntheticFixture,
  localE2eDatabaseSummary,
  requireLocalE2eDatabaseUrl,
} from "./local-e2e-contract.mjs";

const databaseUrl = requireLocalE2eDatabaseUrl();
if (process.env.DATABASE_URL !== databaseUrl) {
  throw new Error("Local E2E seed worker requires its validated database URL");
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

try {
  const existingIdentity = await prisma.accountIdentity.findUnique({
    where: {
      provider_providerUserId: {
        provider: LOCAL_E2E_FIXTURE.provider,
        providerUserId: LOCAL_E2E_FIXTURE.providerUserId,
      },
    },
    select: { accountId: true },
  });

  if (existingIdentity) {
    await prisma.$transaction(async (transaction) => {
      await transaction.walletLink.deleteMany({ where: { accountId: existingIdentity.accountId } });
      await transaction.accountIdentity.deleteMany({ where: { accountId: existingIdentity.accountId } });
      await transaction.account.delete({ where: { id: existingIdentity.accountId } });
    });
  }

  const account = await prisma.account.create({
    data: {
      status: "ACTIVE",
      email: null,
      displayName: null,
      avatarUrl: null,
      identities: {
        create: {
          provider: LOCAL_E2E_FIXTURE.provider,
          providerUserId: LOCAL_E2E_FIXTURE.providerUserId,
          email: null,
          displayName: null,
          avatarUrl: null,
        },
      },
      walletLinks: {
        create: {
          walletAddress: LOCAL_E2E_FIXTURE.walletAddress,
          provider: LOCAL_E2E_FIXTURE.walletProvider,
          email: null,
          status: "LINKED",
        },
      },
    },
    include: { identities: true, walletLinks: true },
  });

  assertSyntheticFixture({
    account,
    identities: account.identities,
    walletLinks: account.walletLinks,
  });
  console.log(
    `Local E2E fixture seeded: label=${LOCAL_E2E_FIXTURE.label} identities=${account.identities.length} walletLinks=${account.walletLinks.length} ${localE2eDatabaseSummary(databaseUrl)}`
  );
} finally {
  await prisma.$disconnect();
}
