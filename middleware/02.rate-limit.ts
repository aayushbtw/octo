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

export default defineMiddleware(async (c, next) => {
  const key = c.req.header("CF-Connecting-IP") ?? "anonymous";

  if (!(await isAllowed(key))) {
    throw new HTTPException(429, { message: "Too many requests" });
  }

  await next();
});
