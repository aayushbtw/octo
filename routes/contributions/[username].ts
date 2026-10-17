import { HTTPException } from "hono/http-exception";
import { parse } from "node-html-parser";
import { defineHandler } from "void";

import { cache } from "../../src/lib/cache";
import { fetchGitHub } from "../../src/lib/github";

const SIX_HOURS = 21_600;
const ONE_HOUR = 3600;

function parseYear(param: string | undefined): number | null {
  if (param === undefined || param === "") {
    return null;
  }
  const year = Number.parseInt(param, 10);
  const currentYear = new Date().getFullYear();
  if (Number.isNaN(year) || year < 2005 || year > currentYear) {
    throw new HTTPException(400, { message: "Invalid year parameter" });
  }
  return year;
}

async function fetchHtml(username: string, year: number | null) {
  const range = year === null ? "" : `?from=${year}-01-01&to=${year}-12-31`;
  const res = await fetchGitHub(`/users/${username}/contributions${range}`);

  if (res.status === 404) {
    throw new HTTPException(404, { message: "User not found" });
  }
  if (!res.ok) {
    throw new HTTPException(502, { message: "Bad gateway" });
  }

  return await res.text();
}

function parseHtml(html: string) {
  const root = parse(html);

  const tooltips = new Map(
    root
      .querySelectorAll("tool-tip[for]")
      .map((tip) => [tip.getAttribute("for"), tip.text.trim()])
  );

  const contributions = root
    .querySelectorAll("td.ContributionCalendar-day[data-date]")
    .map((cell) => ({
      date: cell.getAttribute("data-date") ?? "",
      count:
        Number.parseInt(tooltips.get(cell.getAttribute("id")) ?? "0", 10) || 0,
      level: Number.parseInt(cell.getAttribute("data-level") ?? "0", 10),
    }))
    .toSorted((a, b) => a.date.localeCompare(b.date));

  const heading = root.querySelector("h2.f4.text-normal.mb-2");
  const totalMatch = heading?.text.match(/(?<total>[\d,]+)\s+contributions?/u);
  const total = totalMatch?.groups
    ? Number.parseInt(totalMatch.groups.total.replaceAll(",", ""), 10)
    : contributions.reduce((sum, c) => sum + c.count, 0);

  return { total, contributions };
}

export const GET = defineHandler(
  async (c, next) => {
    const year = parseYear(c.req.query("y"));
    const isPastYear = year !== null && year < new Date().getFullYear();
    return await cache({ ttl: isPastYear ? SIX_HOURS : ONE_HOUR })(c, next);
  },
  async (c) => {
    const year = parseYear(c.req.query("y"));
    const { username } = c.req.param();
    const html = await fetchHtml(username, year);
    return c.json(parseHtml(html));
  }
);
