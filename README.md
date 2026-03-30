# Octo

A lightweight API for structured GitHub profile data. Built with [Hono](https://hono.dev/) & [Cloudflare Workers](https://workers.cloudflare.com/).

**Base URL:** `https://octo.aayush.page`

## Endpoints

### `GET /contributions/:username`

Returns the contribution calendar for a GitHub user.

| Parameter | In    | Description                          |
| --------- | ----- | ------------------------------------ |
| `y`       | query | Year (defaults to current, min 2005) |

```json
{
  "total": 1024,
  "year": "2025",
  "contributions": [
    { "date": "2025-01-01", "count": 5, "level": 2 }
  ]
}
```

### `GET /pinned/:username`

Returns the pinned repositories for a GitHub user.

```json
[
  {
    "repo": "octo",
    "url": "https://github.com/aayush/octo",
    "description": "GitHub profile data API",
    "language": "TypeScript",
    "stars": 10,
    "forks": 2
  }
]
```

## Stack

- [Hono](https://hono.dev) on [Cloudflare Workers](https://workers.cloudflare.com)
- HTML parsing via [node-html-parser](https://github.com/niceh/node-html-parser)
- Edge caching (1h TTL), rate limiting (60 req/min per IP), CORS

## Development

```sh
pnpm install
pnpm dev
```

## Deployment

```sh
pnpm deploy
```

## Type generation

Sync Cloudflare binding types from `wrangler.jsonc`:

```sh
pnpm cf-typegen
```
