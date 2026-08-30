export default async function(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!process.env.FEEDBACK) return res.status(500).end();
  await fetch(process.env.FEEDBACK, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content: "<@1138813124946956298>",
      embeds: [{
        title: "Someone Suggested A New Feature Or Sent An FeedBack",
        description: req.body["message"] || "",
        fields: [
          { name: "Which Executor Was Used:", value: "" + (req.body["executor"] || "Spoofed") },
          { name: "Which Script Was Used:", value: "" + (req.body["script"] || "Spoofed") }
        ],
        timestamp: new Date().toJSON()
      }]
    })
  });
  res.end();
}
