import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/pizza-admin.apk",
        destination:
          "https://uadrrjrlhfttithjmdye.supabase.co/storage/v1/object/public/releases/Sole-What-Admin-v1.0.9.apk?download=Sole-What-Admin-v1.0.9.apk",
        permanent: false,
      },
      {
        source: "/release/pizza-admin.apk",
        destination:
          "https://uadrrjrlhfttithjmdye.supabase.co/storage/v1/object/public/releases/Sole-What-Admin-v1.0.9.apk?download=Sole-What-Admin-v1.0.9.apk",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
