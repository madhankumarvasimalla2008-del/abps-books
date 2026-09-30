import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/catalog',
        destination: '/books',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
