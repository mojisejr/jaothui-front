/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Demo flow entry: land visitors on the v2 (dark-gold) home. Temporary (permanent:false)
  // so it is trivially reversible; the legacy home file at pages/index.tsx is untouched.
  async redirects() {
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
