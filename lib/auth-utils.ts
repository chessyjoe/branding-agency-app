import { createServerClient } from "@/lib/supabase"
import type { NextRequest } from "next/server"

export async function validateAuthentication(request: NextRequest): Promise<{ user: any; error?: string }> {
  try {
    const supabase = createServerClient()

    // Get session from request
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Auth validation error:", error)
      return { user: null, error: "Authentication failed" }
    }

    if (!session?.user) {
      return { user: null, error: "No authenticated user" }
    }

    return { user: session.user }
  } catch (error) {
    console.error("Auth validation error:", error)
    return { user: null, error: "Authentication validation failed" }
  }
}

/**
 * Normalize a rate limiter identifier (e.g., IP address).
 * - Lowercase, strip port if present, trim whitespace.
 * - For IPs: '192.168.1.1:1234' -> '192.168.1.1'
 * - For user IDs: just lowercase/trim.
 */
function normalizeRateLimiterId(identifier: string): string {
  if (!identifier) return "unknown";
  let id = identifier.trim().toLowerCase();
  // Remove port if present (for IPs)
  if (id.includes(":")) {
    id = id.split(":")[0];
  }
  return id;
}

export function createRateLimiter() {
  const requests = new Map<string, { count: number; resetTime: number }>();

  const SOFT_CAP = 2000;
  const HARD_CAP = 1000;
  const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

  const cleanup = () => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => requests.delete(key));
    // Soft cap: trim to HARD_CAP if exceeded
    if (requests.size > SOFT_CAP) {
      console.warn(`[v0] Rate limiter map size exceeded soft cap (${SOFT_CAP}), trimming to hard cap (${HARD_CAP})`);
      const entries = Array.from(requests.entries());
      entries.sort((a, b) => a[1].resetTime - b[1].resetTime);
      const toDelete = entries.slice(0, entries.length - HARD_CAP);
      toDelete.forEach(([key]) => requests.delete(key));
    }
  };

  // Run cleanup more frequently
  setInterval(cleanup, CLEANUP_INTERVAL);

  return {
    checkLimit: (identifier: string, maxRequests = 10, windowMs = 60000): boolean => {
      const id = normalizeRateLimiterId(identifier);
      if (requests.size > HARD_CAP) {
        // Hard cap: reject all new requests until cleanup
        return false;
      }
      const now = Date.now();
      const userRequests = requests.get(id);
      if (!userRequests || now > userRequests.resetTime) {
        requests.set(id, { count: 1, resetTime: now + windowMs });
        return true;
      }
      if (userRequests.count >= maxRequests) {
        return false;
      }
      userRequests.count++;
      return true;
    },
    cleanup,
    forceCleanup: cleanup,
    getSize: () => requests.size,
  };
}

const rateLimiter = createRateLimiter();
export { rateLimiter };
