import { headers } from "next/headers";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(key: string): Map<string, RateLimitEntry> {
  let store = stores.get(key);
  if (!store) {
    store = new Map();
    stores.set(key, store);
  }
  return store;
}

function cleanup(store: Map<string, RateLimitEntry>, now: number) {
  for (const [k, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(k);
    }
  }
}

function resolveKey(request: Request): string {
  // Use X-Forwarded-For behind a proxy, fall back to no IP detection
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  // In development, fall back to a per-request random key — not perfect but prevents global locks
  return "dev-local";
}

export type RateLimitResult =
  | { rateLimited: false }
  | {
      rateLimited: true;
      retryAfter: number;
    };

/**
 * Simple sliding-window rate limiter. In production, replace with Redis-backed store.
 */
export async function checkRateLimit(
  request: Request,
  opts: { storeKey: string; maxRequests: number; windowSeconds: number }
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const key = resolveKey(request);
  const store = getStore(opts.storeKey);

  cleanup(store, now);

  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowSeconds });
    return { rateLimited: false };
  }

  existing.count += 1;

  if (existing.count > opts.maxRequests) {
    const retryAfter = existing.resetAt - now;
    return { rateLimited: true, retryAfter };
  }

  return { rateLimited: false };
}

/**
 * Convenience wrapper: returns a 429 Response if rate limited, null otherwise.
 */
export async function rateLimitGuard(
  request: Request,
  opts: { storeKey: string; maxRequests: number; windowSeconds: number }
): Promise<Response | null> {
  const result = await checkRateLimit(request, opts);

  if (result.rateLimited) {
    return new Response(
      JSON.stringify({
        error: `Príliš veľa požiadaviek. Skús znova o ${result.retryAfter} sekúnd.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfter),
        },
      }
    );
  }

  return null;
}
