import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const requiredFiles = [
  "server/mobile/constants.ts",
  "server/mobile/auth-session.ts",
  "server/mobile/bitkub-next-auth.ts",
  "server/mobile/bitkub-next-handoff.ts",
  "server/mobile/profile.ts",
  "server/mobile/public-journey.ts",
  "server/mobile/response.ts",
  "server/mobile/view-models.ts",
  "pages/oauth/callback.tsx",
  "pages/api/mobile/v1/auth/bitkub-next/session.ts",
  "pages/api/mobile/v1/home.ts",
  "pages/api/mobile/v1/me.ts",
  "pages/api/mobile/v1/profile.ts",
  "pages/api/mobile/v1/buffalos/index.ts",
  "pages/api/mobile/v1/buffalos/featured.ts",
  "pages/api/mobile/v1/certs/[microchip]/index.ts",
  "pages/api/mobile/v1/certs/[microchip]/certificate.ts",
  "pages/api/mobile/v1/certs/[microchip]/rewards/[rewardId].ts",
];

const failures = [];

for (const file of requiredFiles) {
  const fullPath = path.join(root, file);
  if (!existsSync(fullPath)) {
    failures.push(`missing file: ${file}`);
    continue;
  }

  const content = readFileSync(fullPath, "utf8");
  if (file.startsWith("pages/api/mobile/")) {
    if (!content.includes("sendMobileOk") || !content.includes("sendMobileError")) {
      failures.push(`route does not use mobile envelope helpers: ${file}`);
    }
    if (content.includes("/api/mobile/trpc")) {
      failures.push(`route exposes forbidden mobile tRPC bridge: ${file}`);
    }
    if (file.includes("/auth/") || file.endsWith("/me.ts") || file.endsWith("/profile.ts")) {
      if (!content.includes("UNAUTHORIZED")) {
        failures.push(`auth route does not expose mobile unauthorized envelope: ${file}`);
      }
    }
  }
}

const publicJourney = readFileSync(path.join(root, "server/mobile/public-journey.ts"), "utf8");
const expectedExports = [
  "getMobileHome",
  "getMobileFeaturedBuffalos",
  "getMobileBuffalos",
  "getMobileCertDetail",
  "getMobileCertificate",
  "getMobileRewardDetail",
];

for (const exportName of expectedExports) {
  if (!publicJourney.includes(`function ${exportName}`)) {
    failures.push(`missing public journey export: ${exportName}`);
  }
}

const response = readFileSync(path.join(root, "server/mobile/response.ts"), "utf8");
if (!response.includes("Authorization")) {
  failures.push("mobile response CORS does not allow Authorization header");
}

const profile = readFileSync(path.join(root, "server/mobile/profile.ts"), "utf8");
if (!profile.includes("getMemberData") || !profile.includes("toMobileBuffaloCard")) {
  failures.push("mobile profile does not reuse member data and buffalo view-model mapping");
}

const handoff = readFileSync(path.join(root, "server/mobile/bitkub-next-handoff.ts"), "utf8");
if (!handoff.includes("createMobileBitkubNextDeepLink")) {
  failures.push("mobile auth does not expose shared deep-link handoff helper");
}
if (/await\s+registerUserBestEffort/.test(handoff)) {
  failures.push("mobile OAuth callback blocks native redirect on best-effort registration");
}
const forbiddenCallbackBackgroundWork = [
  "register_user_best_effort",
  "registerUserBestEffort",
  "scheduleUserRegistrationBestEffort",
  "setTimeout",
];
for (const forbidden of forbiddenCallbackBackgroundWork) {
  if (handoff.includes(forbidden)) {
    failures.push(
      `mobile OAuth callback helper contains forbidden background work: ${forbidden}`
    );
  }
}

const callbackPage = readFileSync(path.join(root, "pages/oauth/callback.tsx"), "utf8");
if (
  !callbackPage.includes("getServerSideProps") ||
  !callbackPage.includes("redirectToNativeCallback") ||
  !callbackPage.includes("createMobileBitkubNextDeepLink")
) {
  failures.push("mobile OAuth callback does not server-redirect mobile state to native callback");
}

if (failures.length) {
  console.error("Mobile API contract smoke failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Mobile API contract smoke passed");
