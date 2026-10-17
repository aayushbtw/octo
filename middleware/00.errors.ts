import { HTTPException } from "hono/http-exception";
import { defineMiddleware } from "void";

const isHTTPException = (err: Error): err is HTTPException =>
  err instanceof HTTPException ||
  ("getResponse" in err && "status" in err && typeof err.status === "number");

export default defineMiddleware(async (c, next) => {
  await next();

  // Void installs no onError or notFound handler, so errors and unmatched routes reach here as Hono's plain-text defaults.
  if (c.error) {
    if (isHTTPException(c.error)) {
      c.res = c.json({ error: c.error.message }, c.error.status);
      return;
    }
    console.error(
      JSON.stringify({
        error: c.error.message,
        message: "unhandled error",
        path: new URL(c.req.url).pathname,
      })
    );
    c.res = c.json({ error: "Internal server error" }, 500);
    return;
  }

  // Routes only answer 404 by throwing, so a 404 without an error is an unmatched path.
  if (c.res.status === 404) {
    c.res = c.json({ error: "Not found" }, 404);
  }
});
