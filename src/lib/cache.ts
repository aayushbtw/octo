import { createMiddleware } from "hono/factory";

type CacheOptions = {
  ttl: number;
};

export const cache = ({ ttl }: CacheOptions) => {
  return createMiddleware(async (c, next) => {
    const cache = caches.default;
    const cacheKey = new Request(c.req.url, { method: "GET" });

    const cached = await cache.match(cacheKey);
    if (cached) {
      return new Response(cached.body, cached);
    }

    await next();

    if (c.res.ok) {
      const response = c.res.clone();
      const cachedResponse = new Response(response.body, response);
      cachedResponse.headers.set("Cache-Control", `public, max-age=${ttl}`);
      c.executionCtx.waitUntil(cache.put(cacheKey, cachedResponse));
    }
  });
};
