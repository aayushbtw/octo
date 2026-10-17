# Octo

A lightweight API for structured GitHub profile data. Built with [Hono](https://hono.dev/) & [Cloudflare Workers](https://workers.cloudflare.com/).

**Base URL:** `https://octo.aayush.cv` **Rate Limit:** 60 req/min per IP

## Endpoints

### `GET /contributions/:username`

Returns the contribution calendar for a GitHub user. The response matches [github-contributions-api v4](https://github-contributions-api.jogruber.de).

| Parameter | In | Description |
| --- | --- | --- |
| `y` | query | `all` (default), `last` (rolling year), or one or more years (`?y=2024&y=2025`) |

**Cache:** 6h (past years only), 1h otherwise

**Example:**

```sh
curl https://octo.aayush.cv/contributions/aayushbtw
curl 'https://octo.aayush.cv/contributions/aayushbtw?y=last'
curl 'https://octo.aayush.cv/contributions/aayushbtw?y=2024'
```

```json
{
  "total": { "2024": 183, "2025": 1497 },
  "contributions": [{ "date": "2024-01-01", "count": 0, "level": 0 }]
}
```

With `y=last`, `total` is `{ "lastYear": 4307 }`.

### `GET /pinned/:username`

Returns the pinned repositories for a GitHub user.

**Cache:** 2h

**Example:**

```sh
curl https://octo.aayush.cv/pinned/aayushbtw
```

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
