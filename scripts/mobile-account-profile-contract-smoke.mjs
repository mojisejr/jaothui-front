import assert from "node:assert/strict";

const session = await import("../server/mobile/auth-session.ts");
const accountProfile = await import("../server/mobile/account-profile.ts");

const lineOnlyToken = session.createMobileLineAccountSession({
  accountId: "account_line_only",
  lineUserId: "line-only-user",
  email: "line-only@example.test",
  displayName: "Line Only",
});
const lineOnlySession = session.verifyMobileSessionToken(lineOnlyToken.token);
const lineOnlyProfile = await accountProfile.getMobileAccountProfile(lineOnlySession, {
  getAccountProfile: async () => ({
    account: {
      id: "account_line_only",
      identities: [],
      walletLinks: [],
    },
    linkedWallet: null,
  }),
  getMemberData: async () => {
    throw new Error("LINE-only profile must not query legacy wallet member data");
  },
});

assert.equal(lineOnlyProfile.identity.sessionVersion, 2);
assert.equal(lineOnlyProfile.identity.provider, "line");
assert.equal(lineOnlyProfile.identity.accountId, "account_line_only");
assert.equal(lineOnlyProfile.identity.linkedWallet, null);
assert.equal(lineOnlyProfile.member, null);
assert.deepEqual(lineOnlyProfile.ownedBuffalos, []);
assert.equal(lineOnlyProfile.counts.ownedBuffalos, 0);

const lineLinkedToken = session.createMobileLineAccountSession({
  accountId: "account_linked",
  lineUserId: "line-linked-user",
});
const lineLinkedSession = session.verifyMobileSessionToken(lineLinkedToken.token);
let memberLookupWallet = null;
const lineLinkedProfile = await accountProfile.getMobileAccountProfile(lineLinkedSession, {
  getAccountProfile: async () => ({
    account: {
      id: "account_linked",
      identities: [],
      walletLinks: [],
    },
    linkedWallet: {
      walletAddress: "0xlinkedwallet",
      provider: "bitkub-next",
      email: "wallet@example.test",
    },
  }),
  getMemberData: async (walletAddress) => {
    memberLookupWallet = walletAddress;
    return {
      id: 12,
      name: "Linked Member",
      avatar: "https://example.test/member.png",
      email: null,
      farmName: "Linked Farm",
      role: "USER",
      Certificate: [
        {
          tokenId: 7,
          microchip: "MC-7",
          name: "Seven",
          image: "https://example.test/seven.png",
          sex: "female",
          color: "black",
          birthday: "2024-01-01",
          certNo: "CERT-7",
        },
      ],
    };
  },
});

assert.equal(memberLookupWallet, "0xlinkedwallet");
assert.equal(lineLinkedProfile.identity.sessionVersion, 2);
assert.equal(lineLinkedProfile.identity.linkedWallet.walletAddress, "0xlinkedwallet");
assert.equal(lineLinkedProfile.member.email, "wallet@example.test");
assert.equal(lineLinkedProfile.member.statusLabel, "เจ้าของฟาร์ม");
assert.equal(lineLinkedProfile.counts.ownedBuffalos, 1);
assert.equal(lineLinkedProfile.ownedBuffalos[0].microchip, "MC-7");

const bitkubToken = session.createMobileSession({
  walletAddress: "0xbitkubwallet",
  email: "holder@example.test",
});
const bitkubSession = session.verifyMobileSessionToken(bitkubToken.token);
const bitkubProfile = await accountProfile.getMobileAccountProfile(bitkubSession, {
  getAccountProfile: async () => {
    throw new Error("Bitkub v1 profile must not query account profile data");
  },
  getMemberData: async (walletAddress) => {
    assert.equal(walletAddress, "0xbitkubwallet");
    return null;
  },
});

assert.equal(bitkubProfile.identity.sessionVersion, 1);
assert.equal(bitkubProfile.identity.provider, "bitkub-next");
assert.equal(bitkubProfile.identity.walletAddress, "0xbitkubwallet");
assert.equal(bitkubProfile.member, null);
assert.equal(bitkubProfile.counts.ownedBuffalos, 0);

console.log("Mobile account profile contract smoke passed");

