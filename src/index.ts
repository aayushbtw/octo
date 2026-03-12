import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import contributions from "./api/contributions";
import pinned from "./api/pinned";

const app = new Hono();

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  return c.json({ error: "Internal server error" }, 500);
});

app.route("/contributions", contributions);
app.route("/pinned", pinned);

export default app;
