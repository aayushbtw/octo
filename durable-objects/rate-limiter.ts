import { DurableObject } from "cloudflare:workers";
import { defineDurableObject } from "void/durable";

const LIMIT = 60;
const WINDOW_MS = 60_000;

// Timestamps live in memory on purpose: the object outlives a window while traffic flows, and persisting would cost a write per request.
class RateLimiterObject extends DurableObject {
  // The last LIMIT allowed requests; `next` points at the oldest.
  hits = Array.from({ length: LIMIT }, () => Number.NEGATIVE_INFINITY);
  next = 0;

  hit(): boolean {
    const now = Date.now();
    if (now - this.hits[this.next] < WINDOW_MS) {
      return false;
    }
    this.hits[this.next] = now;
    this.next = (this.next + 1) % LIMIT;
    return true;
  }
}

export const RateLimiter = defineDurableObject({
  class: RateLimiterObject,
  name: "rate-limiter",
});

export default RateLimiter;
