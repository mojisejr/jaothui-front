import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const requiredFiles = [
  "server/mobile/constants.ts",
  "server/mobile/public-journey.ts",
  "server/mobile/response.ts",
  "server/mobile/view-models.ts",
  "pages/api/mobile/v1/home.ts",
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

if (failures.length) {
  console.error("Mobile API contract smoke failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Mobile API contract smoke passed");
