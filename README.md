# Octo

A lightweight API for structured GitHub profile data. Built with [Hono](https://hono.dev/) & [Cloudflare Workers](https://workers.cloudflare.com/).

**Base URL:** `https://octo.aayush.cv`
**Rate Limit:** 60 req/min per IP

## Endpoints

### `GET /contributions/:username`

Returns the contribution calendar for a GitHub user.

| Parameter | In    | Description                                                   |
| --------- | ----- | ------------------------------------------------------------- |
| `y`       | query | Year (min 2005). Omit for GitHub's default rolling ~year view |

**Cache:** 1h (current/rolling), 6h (past years)

**Example:**

```sh
curl https://octo.aayush.cv/contributions/aayushbtw
curl https://octo.aayush.cv/contributions/aayushbtw?y=2024
```

```json
{
  "total": 1024,
  "contributions": [
    { "date": "2025-04-20", "count": 5, "level": 2 }
  ]
}
```

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
