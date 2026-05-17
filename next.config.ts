import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  cacheOnFrontEndNav: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    importScripts: ["/sw-push.js"],
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: {
      // Default is 1MB. Avatar uploads (allowed up to 3MB on the client)
      // tripped it: the request body was rejected before the action even
      // ran, and the client saw "An unexpected response was received from
      // the server". Bumped to 5MB to leave headroom for future media
      // (exam uploads, exercise images, etc.).
      bodySizeLimit: "5mb",
    },
  },
};

export default withPWA(nextConfig);
