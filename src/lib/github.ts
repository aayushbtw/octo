const BASE_URL = "https://github.com";
const CACHE_TTL = 3600;

export async function fetchGitHub(path: string): Promise<Response> {
  return fetch(`${BASE_URL}/${path}`, {
    headers: {
      "User-Agent": "octo-cf-worker/1.0",
      Accept: "text/html",
    },
    redirect: "manual",
    cf: {
      cacheTtl: CACHE_TTL,
      cacheEverything: true,
    },
  });
}
