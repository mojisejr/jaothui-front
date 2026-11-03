const homeVersion = process.env.JAOTHUI_HOME_VERSION?.toLowerCase();
const shouldRouteHomeToV2 = homeVersion !== "v1";
const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const eventSanityProjectId = process.env.JAOTHUI_EVENT_SANITY_PROJECT_ID;
const eventSanityDataset = process.env.JAOTHUI_EVENT_SANITY_DATASET;

// News covers come from this configured Sanity project/dataset only. Keep the
// optimizer closed to other CDN tenants, file assets and non-HTTPS endpoints.
if (sanityProjectId && !/^[a-z0-9]+$/.test(sanityProjectId)) {
  throw new Error("Invalid NEXT_PUBLIC_SANITY_PROJECT_ID for image allowlist");
}
if (sanityDataset && !/^[a-z0-9_-]+$/.test(sanityDataset)) {
  throw new Error("Invalid NEXT_PUBLIC_SANITY_DATASET for image allowlist");
}
const sanityImagePatterns = sanityProjectId && sanityDataset ? [{
  protocol: "https",
  hostname: "cdn.sanity.io",
  port: "",
  pathname: `/images/${sanityProjectId}/${sanityDataset}/*`,
}] : [];

// Competition posters use the existing Event catalogue's public tenant metadata.
// No Event credential is needed or exposed by the image optimizer allowlist.
if (eventSanityProjectId && !/^[a-z0-9]+$/.test(eventSanityProjectId)) {
  throw new Error("Invalid JAOTHUI_EVENT_SANITY_PROJECT_ID for image allowlist");
}
if (eventSanityDataset && !/^[a-zA-Z0-9_-]+$/.test(eventSanityDataset)) {
  throw new Error("Invalid JAOTHUI_EVENT_SANITY_DATASET for image allowlist");
}
const eventSanityImagePatterns = eventSanityProjectId && eventSanityDataset ? [{
  protocol: "https",
  hostname: "cdn.sanity.io",
  port: "",
  pathname: `/images/${eventSanityProjectId}/${eventSanityDataset}/*`,
}] : [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Prisma5 uses sslcert for a root CA. Explicit tracing keeps
    // this public CA available in serverless bundles; it contains no private key.
    outputFileTracingIncludes: {
      "/*": ["./prisma/certs/supabase-prod-ca-2021.crt"],
    },
  },
  // Home launch switch:
  // - default or JAOTHUI_HOME_VERSION=v2: land visitors on the v2 dark-gold home
  // - JAOTHUI_HOME_VERSION=v1: keep the legacy pages/index.tsx home at /
  // The redirect stays temporary so launch/rollback does not get stuck behind a 301.
  async redirects() {
    if (!shouldRouteHomeToV2) {
      return [];
    }

    return [
      {
        source: "/",
        destination: "/v2",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/storage/v1/object/public/slipstorage/buffalo/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      ...sanityImagePatterns,
      ...eventSanityImagePatterns,
      {
        protocol: "https",
        hostname: "wtnqjxerhmdnqszkhbvs.supabase.co",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },
};

module.exports = nextConfig;
