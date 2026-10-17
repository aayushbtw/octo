import { env } from "cloudflare:workers";
import { HTTPException } from "hono/http-exception";
import { defineMiddleware } from "void";

export default defineMiddleware(async (c, next) => {
  const key = c.req.header("CF-Connecting-IP") ?? "anonymous";
  const { success } = await env.RATE_LIMITER.limit({ key });

  if (!success) {
    throw new HTTPException(429, { message: "Too many requests" });
  }

  await next();
});
