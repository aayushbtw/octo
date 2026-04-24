import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { parse } from "node-html-parser";

import { cache } from "../lib/cache";
import { fetchGitHub } from "../lib/github";

const SIX_HOURS = 21600;
const ONE_HOUR = 3600;

function parseYear(param: string | undefined): number | null {
	if (!param) return null;
	const year = parseInt(param, 10);
	const currentYear = new Date().getFullYear();
	if (Number.isNaN(year) || year < 2005 || year > currentYear) {
		throw new HTTPException(400, { message: "Invalid year parameter" });
	}
	return year;
}

async function fetchHtml(username: string, year: number | null) {
	const range = year ? `?from=${year}-01-01&to=${year}-12-31` : "";
	const res = await fetchGitHub(`/users/${username}/contributions${range}`);

	if (res.status === 404) throw new HTTPException(404, { message: "User not found" });
	if (!res.ok) throw new HTTPException(502, { message: "Bad gateway" });

	return res.text();
}

function parseHtml(html: string) {
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
			count: parseInt(tooltips.get(cell.getAttribute("id")) ?? "0", 10) || 0,
			level: parseInt(cell.getAttribute("data-level") ?? "0", 10),
		}))
		.sort((a, b) => a.date.localeCompare(b.date));

	const heading = root.querySelector("h2.f4.text-normal.mb-2");
	const totalMatch = heading?.text.match(/([\d,]+)\s+contributions?/);
	const total = totalMatch
		? parseInt(totalMatch[1].replace(/,/g, ""), 10)
		: contributions.reduce((sum, c) => sum + c.count, 0);

	return { total, contributions };
}

const app = new Hono().get(
	"/:username",
	async (c, next) => {
		const year = parseYear(c.req.query("y"));
		const isPastYear = year !== null && year < new Date().getFullYear();
		return cache({ ttl: isPastYear ? SIX_HOURS : ONE_HOUR })(c, next);
	},
	async (c) => {
		const year = parseYear(c.req.query("y"));
		const html = await fetchHtml(c.req.param("username"), year);
		return c.json(parseHtml(html));
	},
);

export default app;
export type AppType = typeof app;
