import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { parse } from "node-html-parser";

import { fetchGitHub } from "../lib/github";

interface Contribution {
  date: string;
  count: number;
  level: number;
}

interface ContributionData {
  total: number;
  year: number;
  contributions: Contribution[];
}

async function fetchHtml(username: string, year: number): Promise<string> {
  const url = `/users/${username}/contributions?from=${year}-01-01&to=${year}-12-31`;
  const res = await fetchGitHub(url);

  if (res.status === 404) {
    throw new HTTPException(404, { message: "User not found" });
  }
  if (!res.ok) {
    throw new HTTPException(502, { message: "Bad gateway" });
  }

  return res.text();
}

function parseHtml(html: string, year: number): ContributionData {
  const root = parse(html);
  const contributions: Contribution[] = [];
  let total = 0;

  const cells = root.querySelectorAll("td.ContributionCalendar-day");

  // Build a map of tool-tip elements keyed by their `for` attribute (matches cell `id`)
  const tooltipsByDayId: Record<string, ReturnType<typeof root.querySelector>> = {};
  for (const tip of root.querySelectorAll("tool-tip")) {
    const forAttr = tip.getAttribute("for");
    if (forAttr) tooltipsByDayId[forAttr] = tip;
  }

  for (const cell of cells) {
    const date = cell.getAttribute("data-date");
    const level = parseInt(cell.getAttribute("data-level") ?? "0", 10);

    if (!date) continue;

    let count = 0;
    const cellId = cell.getAttribute("id");

    if (cellId && tooltipsByDayId[cellId]) {
      const match = tooltipsByDayId[cellId].text.trim().match(/^(\d+)/);
      if (match) count = parseInt(match[1], 10);
    }

    total += count;
    contributions.push({ date, count, level });
  }

  // Try to parse total from the heading if available
  const heading = root.querySelector("h2.f4.text-normal.mb-2");
  if (heading) {
    const match = heading.text.match(/([\d,]+)\s+contributions?/);
    if (match) total = parseInt(match[1].replace(/,/g, ""), 10);
  }

  return { total, year, contributions };
}

const app = new Hono()
  .get("/:username", async (c) => {
    const username = c.req.param("username");
    const yearParam = c.req.query("y");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (Number.isNaN(year) || year < 2005 || year > new Date().getFullYear()) {
      throw new HTTPException(400, { message: "Invalid year parameter" });
    }

    const html = await fetchHtml(username, year);
    const data = parseHtml(html, year);
    return c.json(data);
  });

export default app;
export type AppType = typeof app;
