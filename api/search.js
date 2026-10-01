const blurl = 'https://raw.githubusercontent.com/aabbaaii13/aabbaaii/refs/heads/main/AbauiSearcher/blacklist.txt';
const api = 'https://api.rscripts.net/v1';
const str = v => typeof v === 'string' ? v.trim() : '';
function strip(list, bl) {
	if (!Array.isArray(list)) return [];
	return list.filter(s => s && typeof s === 'object' && ![s.id, s.slug, s.rawScript].some(v => bl.has(str(v))));
}
export default async function(req, res) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		return res.status(404).end();
	}
	const key = process.env.RAK;
	if (!key) return res.status(500).json({ success: false, error: 'RSCRIPTS API KEY IS NOT ADDED' });
	const mode = str(req.query?.mode);
	const q = str(req.query?.q);
	if (mode && mode !== 'trending') return res.status(400).json({ success: false, error: 'INVALID MODE' });
	if (q.length > 100) return res.status(400).json({ success: false, error: 'INVALID QUERY' });
	try {
		const blres = await fetch(blurl, { cache: 'no-store' });
		if (!blres.ok) return res.status(503).json({ success: false, error: 'BLACKLIST UNAVAILABLE' });
		const text = await blres.text();
		if (text.length > 1024 * 1024) return res.status(503).json({ success: false, error: 'BLACKLIST TOO LARGE' });
		const bl = new Set(
			text.split(/\r?\n/)
				.map(l => l.trim())
				.filter(l => l && l[0] !== '#' && l.length <= 500)
		);
		let url = `${api}/scripts?sort=recommended&limit=20&page=1&includeScript=true`;
		if (mode === 'trending') url = `${api}/trending`;
		else if (q) url = `${api}/search?q=${encodeURIComponent(q)}&index=scripts&limit=20&page=1&includeScript=true`;

		const up = await fetch(url, {
			headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
			cache: 'no-store'
		});
		const body = await up.text();
		if (!up.ok) return res.status(up.status).send(body);
		let json;
		try {
			json = JSON.parse(body);
		} catch {}
		if (!json || typeof json !== 'object') {
			return res.status(502).json({ success: false, error: 'INVALID RESPONSE' });
		}
		const d = json.data;
		if (mode === 'trending') {
			if (!d || typeof d !== 'object') {
				return res.status(502).json({ success: false, error: 'INVALID TRENDING' });
			}
			d.rising = strip(d.rising, bl);
			d.trending = strip(d.trending, bl);
		} else if (Array.isArray(d)) {
			json.data = strip(d, bl);
		} else if (d && Array.isArray(d.scripts)) {
			d.scripts = strip(d.scripts, bl);
		}
		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json(json);
	} catch {
		return res.status(502).json({ success: false, error: 'REQUEST FAILED' });
	}
}
