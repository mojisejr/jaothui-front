import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const page = read("pages/delete-account.tsx");
const support = read("pages/support.tsx");
const app = read("pages/_app.tsx");
const normalizedPage = page.replace(/\s+/g, " ");

assert(page.includes("DeleteAccountPage.publicPage = true"), "/delete-account must remain a publicPage");
assert(
  app.includes("if (PageComponent.publicPage)") && app.includes("return <PageComponent {...pageProps} />"),
  "public pages must bypass global wallet and auth providers"
);

const supportEmail = support.match(/href="mailto:([^?\"]+)/)?.[1];
const pageMailto = page.match(/href="mailto:([^?\"]+)/g) ?? [];
assert(supportEmail, "Support page must define the existing support email channel");
assert(pageMailto.length === 1, "/delete-account must expose exactly one support mailto link");
assert(
  pageMailto[0] === `href="mailto:${supportEmail}`,
  "/delete-account must use the existing support email channel only"
);

for (const forbiddenSource of [
  "<form",
  "<input",
  "<textarea",
  "onSubmit=",
  "softDeleteAccount",
  "/api/mobile/v2/account",
  "fetch(",
  "axios",
  "trpc",
  "wagmi",
  "rainbowkit",
  "BitkubNextProvider",
  "bitkubNextContext",
  "auth-session",
  "account.service",
]) {
  assert(!page.includes(forbiddenSource), `/delete-account must not include ${forbiddenSource}`);
}

assert(normalizedPage.includes("Do not send account IDs"), "/delete-account must prohibit account ID collection");
assert(normalizedPage.includes("wallet addresses"), "/delete-account must prohibit wallet value collection");
assert(normalizedPage.includes("private keys, recovery phrases, or one-time passwords"), "/delete-account must prohibit secret collection");
assert(
  normalizedPage.includes("minimal non-personal audit record") &&
    normalizedPage.includes("deletion and authorization history"),
  "/delete-account must describe the policy-backed audit purpose"
);
assert(
  normalizedPage.includes("Non-personal Account ID and role") &&
    normalizedPage.includes("audit anchor and authorization-history context"),
  "/delete-account must disclose the policy-backed retained audit fields"
);
assert(
  !normalizedPage.includes("No retention duration is stated here"),
  "/delete-account must not include unhelpful retention-duration copy"
);

console.log("DELETE_ACCOUNT_PAGE_CONTRACT_OK");
