export default async function(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(404).json({ error: "404 Not Found" });
  }

  if (!process.env.FEEDBACK) {
    return res.status(500).json({ error: "The System Isnt Configured" });
  }

  if (!req.headers["content-type"] || !req.headers["content-type"].toLowerCase().startsWith("application/json")) {
    return res.status(415).json({ error: "Content-Type Must Be application/json" });
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Invalid Body" });
  }

  const allowed = ["message", "script", "id", "slug", "uploader", "executor"];

  for (const key of Object.keys(req.body)) {
    if (!allowed.includes(key)) {
      return res.status(400).json({ error: "Invalid Field" });
    }
  }

  const clean = (value, max) => {
    if (value === undefined || value === null) return "";
    if (typeof value !== "string") return null;

    value = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

    if (value.length > max) return null;

    return value;
  };

  const message = clean(req.body.message, 500);
  const script = clean(req.body.script, 200);
  const id = clean(req.body.id, 100);
  const slug = clean(req.body.slug, 150);
  const uploader = clean(req.body.uploader, 100);
  const executor = clean(req.body.executor, 100);

  if (
    message === null ||
    script === null ||
    id === null ||
    slug === null ||
    uploader === null ||
    executor === null
  ) {
    return res.status(400).json({ error: "Invalid Field Length Or Type" });
  }

  if (!id && !slug) {
    return res.status(400).json({ error: "Script Identifier Required" });
  }

  if (slug && !/^[a-zA-Z0-9._-]+$/.test(slug)) {
    return res.status(400).json({ error: "Invalid Script Slug" });
  }

  if (id && !/^[a-zA-Z0-9._-]+$/.test(id)) {
    return res.status(400).json({ error: "Invalid Script ID" });
  }

  const webhook = process.env.FEEDBACK;

  try {
    const webhookUrl = new URL(webhook);

    if (webhookUrl.protocol !== "https:") {
      return res.status(500).json({ error: "Invalid Report" });
    }
  } catch {
    return res.status(500).json({ error: "Invalid Report" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        content: "<@1138813124946956298>",
        allowed_mentions: {
          parse: []
        },
        embeds: [{
          title: "Someone Reported A Script",
          description: message || "No MessagE",
          fields: [
            {
              name: "Script",
              value: script || "Unknown",
              inline: false
            },
            {
              name: "Script ID",
              value: id || "Unknown",
              inline: true
            },
            {
              name: "Script Slug",
              value: slug || "Unknown",
              inline: true
            },
            {
              name: "Uploader",
              value: uploader || "Unknown",
              inline: true
            },
            {
              name: "Executor",
              value: executor || "Spoofed / Unknown",
              inline: true
            }
          ],
          timestamp: new Date().toISOString()
        }]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Rejected" });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(502).json({ error: "Failed To Report It" });
  } finally {
    clearTimeout(timeout);
  }
    }
