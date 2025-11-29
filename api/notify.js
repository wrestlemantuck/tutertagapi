import fetch from "node-fetch";

// In-memory rate limiting store (for small-scale usage)
const requestCounts = {};

function isRateLimited(ip) {
  const now = Date.now();
  const window = 60000; // 1 minute window
  const maxRequests = 5; // max requests per IP per window

  if (!requestCounts[ip]) requestCounts[ip] = [];

  // Remove old timestamps
  requestCounts[ip] = requestCounts[ip].filter(time => now - time < window);

  if (requestCounts[ip].length >= maxRequests) return true;

  requestCounts[ip].push(now);
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // Rate limiting check
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const { message, token } = req.body;

  // Token verification
  if (!token || token !== process.env.SECRET_API_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Basic payload validation
  if (!message || typeof message !== "string" || message.length > 2000) {
    return res.status(400).json({ error: "Invalid message" });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook error: ${response.status}`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook send failed:", err);
    res.status(500).json({ error: "Failed to send webhook" });
  }
}
