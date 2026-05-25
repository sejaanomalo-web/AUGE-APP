import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/cadastro(.*)",
  "/api/webhooks(.*)",
  // PWA + cron endpoints must be reachable without Clerk auth
  "/manifest.json",
  "/sw.js",
  "/sw-push.js",
  "/workbox-(.*)",
  "/swe-worker-(.*)",
  "/api/cron(.*)",
]);

// Rate-limit applies to /api/* with two carve-outs:
// - /api/cron       → authenticated by CRON_SECRET, fired by Vercel Cron
// - /api/webhooks   → authenticated by 3rd-party signatures (Clerk, etc.)
const isRateLimitedRoute = createRouteMatcher([
  "/api/((?!cron|webhooks).*)",
]);

// Lazy singleton so missing env vars don't crash the module at boot.
let ratelimit: Ratelimit | null = null;
let warnedMissingEnv = false;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warnedMissingEnv) {
      console.warn(
        "[middleware] UPSTASH_REDIS_REST_URL/TOKEN ausentes — rate limit desativado.",
      );
      warnedMissingEnv = true;
    }
    return null;
  }
  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "ratelimit:auge:api",
  });
  return ratelimit;
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  if (isRateLimitedRoute(request)) {
    const limiter = getRatelimit();
    if (limiter) {
      // x-forwarded-for pode vir como lista; usar o primeiro hop (cliente).
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "anonymous";
      const { success, limit, remaining, reset } = await limiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests" },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": String(limit),
              "X-RateLimit-Remaining": String(remaining),
              "X-RateLimit-Reset": String(reset),
            },
          },
        );
      }
    }
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
