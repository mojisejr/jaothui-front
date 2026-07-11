const homeVersion = process.env.JAOTHUI_HOME_VERSION?.toLowerCase();
const shouldRouteHomeToV2 = homeVersion !== "v1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
