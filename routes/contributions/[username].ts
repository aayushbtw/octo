import { HTTPException } from "hono/http-exception";
import { parse } from "node-html-parser";
import { defineHandler } from "void";

import { cache } from "../../src/lib/cache";
import { fetchGitHub } from "../../src/lib/github";

const SIX_HOURS = 21_600;
const ONE_HOUR = 3600;

type Range = "all" | "last" | number[];

const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/iu;

function parseRange(query: string[] = []): Range {
  const params = query.filter(Boolean);
  if (params.length === 0) {
    return "all";
  }
  if (params.length === 1 && (params[0] === "all" || params[0] === "last")) {
    return params[0];
  }
  const years = [...new Set(params.map(Number))];
  const currentYear = new Date().getFullYear();
  if (
    !years.every(
      (year) => Number.isInteger(year) && year >= 2005 && year <= currentYear
    )
  ) {
    throw new HTTPException(400, { message: "Invalid year parameter" });
  }
  return years;
}

async function fetchHtml(
  path: string,
  username: string,
  headers?: Record<string, string>
) {
  const res = await fetchGitHub(path, headers);

  if (res.status === 404) {
    throw new HTTPException(404, {
      message: `GitHub user "${username}" not found.`,
    });
  }
  if (!res.ok) {
    throw new HTTPException(502, { message: "Bad gateway" });
  }

  return await res.text();
}

async function fetchYears(username: string) {
  const html = await fetchHtml(
    `/${username}?action=show&controller=profiles&tab=contributions&user_id=${username}`,
    username,
    { "X-Requested-With": "XMLHttpRequest" }
  );
  const years = [...html.matchAll(/id="year-link-(?<year>\d+)"/gu)].map(
    (match) => Number(match.groups?.year)
  );
  if (years.length === 0) {
    throw new HTTPException(502, { message: "Bad gateway" });
  }
  return years;
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
    const range = parseRange(c.req.queries("y"));
    const currentYear = new Date().getFullYear();
    const isPastOnly =
      Array.isArray(range) && range.every((year) => year < currentYear);
    return await cache({ ttl: isPastOnly ? SIX_HOURS : ONE_HOUR })(c, next);
  },
  async (c) => {
    const range = parseRange(c.req.queries("y"));
    const { username } = c.req.param();
    if (!USERNAME.test(username)) {
      throw new HTTPException(404, {
        message: `GitHub user "${username}" not found.`,
      });
    }

    if (range === "last") {
      const html = await fetchHtml(
        `/users/${username}/contributions`,
        username
      );
      const { total, contributions } = parseHtml(html);
      return c.json({ total: { lastYear: total }, contributions });
    }

    const years = range === "all" ? await fetchYears(username) : range;
    const calendars = await Promise.all(
      years.map(async (year) =>
        parseHtml(
          await fetchHtml(
            `/users/${username}/contributions?from=${year}-01-01&to=${year}-12-31`,
            username
          )
        )
      )
    );

    return c.json({
      total: Object.fromEntries(
        years.map((year, i) => [year, calendars[i].total])
      ),
      contributions: calendars.flatMap((calendar) => calendar.contributions),
    });
  }
);
