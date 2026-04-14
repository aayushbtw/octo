const BASE_URL = "https://github.com";

export async function fetchGitHub(path: string): Promise<Response> {
	return fetch(`${BASE_URL}/${path}`, {
		headers: {
			"User-Agent": "octo-cf-worker/1.0",
			Accept: "text/html",
		},
		redirect: "manual",
	});
}
