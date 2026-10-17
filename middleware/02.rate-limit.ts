import { HTTPException } from "hono/http-exception";
import { defineMiddleware } from "void";

import { RateLimiter } from "../durable-objects/rate-limiter";

async function isAllowed(key: string): Promise<boolean> {
  try {
    return await RateLimiter.get(key).hit();
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }
    if ("overloaded" in error && error.overloaded === true) {
      return false;
    }
    // Fail open: a limiter outage shouldn't take down a read-only API.
    console.error(
      JSON.stringify({
        error: error.message,
        message: "rate limiter unavailable",
      })
    );
    return true;
  }
}

// One IPv6 client owns a whole /64, so keying on the full address lets it rotate past the limit.
function clientKey(ip: string): string {
  if (!ip.includes(":")) {
    return ip;
  }
  const [head = "", tail = ""] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const zeros = Array.from(
    { length: 8 - left.length - right.length },
    () => "0"
  );
  const prefix = [...left, ...zeros, ...right]
    .slice(0, 4)
    .map((group) => Number.parseInt(group, 16).toString(16));
  return `${prefix.join(":")}::/64`;
}

export default defineMiddleware(async (c, next) => {
  const key = clientKey(c.req.header("CF-Connecting-IP") ?? "anonymous");

  if (!(await isAllowed(key))) {
    throw new HTTPException(429, { message: "Too many requests" });
  }

  await next();
});
