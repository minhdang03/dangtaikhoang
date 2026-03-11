import type { NextConfig } from "next";

const pkg = require("./package.json");

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: `v${pkg.version}`,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.vietqr.io",
      },
    ],
  },
};

export default nextConfig;
