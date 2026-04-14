import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

const RATE_LIMIT_CONTEXT_KEY = "rate_limit_passed";

type RateLimitMiddlewareOptions = {
	rateLimiter: (c: Context) => RateLimit;
	getRateLimitKey: (c: Context) => string;
};

export const rateLimit = ({
	rateLimiter,
	getRateLimitKey,
}: RateLimitMiddlewareOptions) => {
	return createMiddleware(async (c, next) => {
		const key = getRateLimitKey(c);
		if (!key) {
			throw new HTTPException(400, { message: "Missing rate limit key" });
		}

		const limiter = rateLimiter(c);
		const { success } = await limiter.limit({ key });

		// Store the result in context for downstream access
		c.set(RATE_LIMIT_CONTEXT_KEY, success);

		if (!success) {
			throw new HTTPException(429, { message: "Too many requests" });
		}

		await next();
	});
};

export const isRateLimitOk = (c: Context): boolean => {
	return c.get(RATE_LIMIT_CONTEXT_KEY) ?? false;
};
