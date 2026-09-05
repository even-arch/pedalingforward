import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { sanity as sanityCacheLife } from "next-sanity/live/cache-life";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    default: sanityCacheLife,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
};

export default withNextIntl(nextConfig);
