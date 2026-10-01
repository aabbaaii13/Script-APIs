export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(404).json({
			success: false,
			error: "404 Not Found"
		});
	}

	const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
	const mode = req.query.mode === "trending" ? "trending" : "search";
	const page = Math.max(1, Math.min(Number(req.query.page) || 1, 100));

	if (mode === "search" && !q) {
		return res.status(400).json({
			success: false,
			error: "Search Something Please"
		});
	}

	try {
		const apiKey = process.env.RAK;

		if (!apiKey) {
			return res.status(500).json({
				success: false,
				error: "I Forgot The API Key"
			});
		}

		let url;

		if (mode === "trending") {
			url = new URL("https://api.rscripts.net/v1/trending");

			url.searchParams.set("htmlDescription", "false");
			url.searchParams.set("includeScript", "false");
		} else {
			url = new URL("https://api.rscripts.net/v1/search");

			url.searchParams.set("q", q);
			url.searchParams.set("index", "scripts");
			url.searchParams.set("limit", "20");
			url.searchParams.set("page", String(page));
			url.searchParams.set("htmlDescription", "false");
			url.searchParams.set("includeScript", "false");
		}

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${apiKey}`,
				"Accept": "application/json"
			}
		});

		const body = await response.text();

		res.status(response.status);
		res.setHeader("Content-Type", "application/json");
		res.setHeader(
			"Cache-Control",
			mode === "trending"
				? "public, s-maxage=30, stale-while-revalidate=60"
				: "no-store"
		);

		return res.send(body);
	} catch (error) {
		return res.status(503).json({
			success: false,
			error: "RScripts Is Unavailable"
		});
	}
}
