import { createMiddleware } from "hono/factory";

interface CacheOptions {
  ttl: number;
}

export const cache = ({ ttl }: CacheOptions) =>
  createMiddleware(async (c, next) => {
    const store = caches.default;
    const cacheKey = new Request(c.req.url, { method: "GET" });

    const cached = await store.match(cacheKey);
    if (cached) {
      c.res = new Response(cached.body, cached);
      return;
    }

    await next();

    if (c.res.ok) {
      const response = c.res.clone();
      const cachedResponse = new Response(response.body, response);
      cachedResponse.headers.set("Cache-Control", `public, max-age=${ttl}`);
      c.executionCtx.waitUntil(store.put(cacheKey, cachedResponse));
    }
  });
