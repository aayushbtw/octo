import { cors } from "hono/cors";
import { defineMiddleware } from "void";

export default defineMiddleware(cors({ allowMethods: ["GET"], origin: "*" }));
