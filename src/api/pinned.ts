import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { parse } from "node-html-parser";

import { cache } from "../lib/cache";
import { fetchGitHub } from "../lib/github";

const TWO_HOURS = 7200;

interface PinnedRepo {
	repo: string;
	url: string;
	description: string;
	language: string;
	stars: number;
	forks: number;
}

async function fetchHtml(username: string): Promise<string> {
	const res = await fetchGitHub(username);

	if (res.status === 404) {
		throw new HTTPException(404, { message: "User not found" });
	}
	if (!res.ok) {
		throw new HTTPException(502, { message: "Bad gateway" });
	}

	return res.text();
}

function parseHtml(html: string): PinnedRepo[] {
	const root = parse(html);
	const items = root.querySelectorAll(".pinned-item-list-item-content");
	const pinned: PinnedRepo[] = [];

	for (const item of items) {
		const anchor = item.querySelector("a.text-bold");
		if (!anchor) continue;

		const repo = anchor.text.trim();
		const href = anchor.getAttribute("href") ?? "";
		const url = `https://github.com${href}`;

		const descEl = item.querySelector("p.pinned-item-desc");
		const description = descEl ? descEl.text.trim() : "";

		const langEl = item.querySelector("[itemprop='programmingLanguage']");
		const language = langEl ? langEl.text.trim() : "";

		let stars = 0;
		let forks = 0;

		const links = item.querySelectorAll("a.pinned-item-meta");
		for (const link of links) {
			const linkHref = link.getAttribute("href") ?? "";
			const count = parseInt(link.text.trim().replace(/,/g, ""), 10) || 0;
			if (linkHref.includes("/stargazers")) stars = count;
			else if (linkHref.includes("/forks")) forks = count;
		}

		pinned.push({ repo, url, description, language, stars, forks });
	}

	return pinned;
}

const app = new Hono().get(
	"/:username",
	cache({ ttl: TWO_HOURS }),
	async (c) => {
		const username = c.req.param("username");
		const html = await fetchHtml(username);
		const data = parseHtml(html);
		return c.json(data);
	},
);

export default app;
export type AppType = typeof app;
