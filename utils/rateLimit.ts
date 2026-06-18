import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function checkRateLimit(
  req: Request,
  options?: { windowMs?: number; maxRequests?: number },
): NextResponse | null {
  const windowMs = options?.windowMs ?? RATE_LIMIT_WINDOW_MS;
  const maxRequests = options?.maxRequests ?? RATE_LIMIT_MAX_REQUESTS;

  const ip = getIp(req);
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return null;
  }

  if (entry.count >= maxRequests) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  entry.count++;
  return null;
}
