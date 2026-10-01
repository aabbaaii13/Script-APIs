const fields = ['id', 'slug', 'title', 'creator', 'rawScript', 'reason'];
const str = v => typeof v === 'string' ? v.trim() : '';
export default async function(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(404).end();
	}
	if (!process.env.REPORT) return res.status(500).end();
	if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
		return res.status(415).end();
	}
	try {
		const b = req.body;
		if (!b || typeof b !== 'object' || Array.isArray(b)) return res.status(400).end();
		if (Object.keys(b).some(k => !fields.includes(k))) return res.status(400).end();
		const id = str(b.id);
		const slug = str(b.slug);
		const title = str(b.title);
		const creator = str(b.creator);
		const raw = str(b.rawScript);
		const reason = str(b.reason);
		if (!id && !slug) return res.status(400).end();
		if (!title || !creator) return res.status(400).end();
		if (id && !/^[a-f0-9]{24}$/i.test(id)) return res.status(400).end();
		if (slug && !/^[a-z0-9][a-z0-9-]{0,150}$/.test(slug)) return res.status(400).end();
		if (title.length > 200 || creator.length > 100 || reason.length > 500) return res.status(400).end();
		if (raw) {
			const u = new URL(raw);
			if (u.protocol !== 'https:' || u.hostname !== 'rscripts.net' || !u.pathname.startsWith('/raw/')) {
				return res.status(400).end();
			}
		}
		const hook = await fetch(process.env.REPORT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				content: '<@1138813124946956298>',
				allowed_mentions: { parse: [] },
				embeds: [{
					title: 'Someone Reported A Script',
					description: '',
					fields: [
						{ name: 'Script ID:', value: id || 'Not PROvided' },
						{ name: 'Script Slug:', value: slug || 'Not PROvided' },
						{ name: 'Script Title:', value: title },
						{ name: 'Creator:', value: creator },
						{ name: 'Raw Script:', value: raw || 'Not PROvided' },
						{ name: 'Report:', value: reason || 'No ReaSON' }
					],
					timestamp: new Date().toISOString()
				}]
			})
		});
		if (!hook.ok) return res.status(502).end();
		return res.status(200).json({ success: true });
	} catch {
		return res.status(400).end();
	}
}
