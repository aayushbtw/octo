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

function parseCount(text: string): number {
  const match = text.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseHtml(html: string, year: number): ContributionData {
  const root = parse(html);

  const tooltips = new Map(
    root
      .querySelectorAll("tool-tip[for]")
      .map((tip) => [tip.getAttribute("for"), tip.text.trim()]),
  );

  const contributions = root
    .querySelectorAll("td.ContributionCalendar-day[data-date]")
    .map((cell) => ({
      date: cell.getAttribute("data-date") ?? "",
      count: parseCount(tooltips.get(cell.getAttribute("id")) ?? ""),
      level: parseInt(cell.getAttribute("data-level") ?? "0", 10),
    }));

  const heading = root.querySelector("h2.f4.text-normal.mb-2");
  const totalMatch = heading?.text.match(/([\d,]+)\s+contributions?/);
  const total = totalMatch
    ? parseInt(totalMatch[1].replace(/,/g, ""), 10)
    : contributions.reduce((sum, c) => sum + c.count, 0);

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
