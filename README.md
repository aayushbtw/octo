# Octo

A lightweight API for structured GitHub profile data. Built with [Hono](https://hono.dev/) & [Cloudflare Workers](https://workers.cloudflare.com/).

**Base URL:** `https://octo.aayush.cv`
**Rate Limit:** 60 req/min per IP  
**Cache:** 1 hour TTL per route

## Endpoints

### `GET /contributions/:username`

Returns the contribution calendar for a GitHub user.

| Parameter | In    | Description                          |
| --------- | ----- | ------------------------------------ |
| `y`       | query | Year (defaults to current, min 2005) |

**Example:**

```sh
curl https://octo.aayush.cv/contributions/aayushbtw
curl https://octo.aayush.cv/contributions/aayushbtw?y=2024
```

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
