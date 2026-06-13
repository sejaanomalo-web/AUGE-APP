import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  cacheOnFrontEndNav: true,
  // `/` é uma página estática (landing). Com dynamicStartUrl:false o start_url
  // entra no PRECACHE e é servido do cache instantaneamente no launch, em vez
  // do NetworkFirst (que esperava a rede a cada abertura — os ~5s de cold start
  // do app instalado). Revalida em background no próximo ciclo do SW.
  cacheStartUrl: true,
  dynamicStartUrl: false,
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
      bodySizeLimit: "5mb",
    },
    // Router cache do cliente: ao voltar para uma aba visitada há pouco, reusa
    // o conteúdo em cache em vez de refazer o round-trip (auth + Prisma). As
    // mutações já chamam revalidatePath/router.refresh, então dados do próprio
    // usuário continuam atualizando na hora; só muda a percepção de velocidade.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Reescreve imports de barrel para deep-imports por símbolo, tirando peso
    // do First Load JS compartilhado (lucide-react é usado em ~90 arquivos,
    // inclusive nos layouts sempre carregados). Comportamento idêntico.
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withSentryConfig(withPWA(nextConfig), {
  org: "anomalo-hub",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});