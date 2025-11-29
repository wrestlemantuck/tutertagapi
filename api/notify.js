import crypto from "crypto";
import fetch from "node-fetch";

// In-memory rate limiting (small-scale)
const requestCounts = {};

function isRateLimited(ip) {
  const now = Date.now();
  const window = 60000; // 1 minute
  const maxRequests = 5;

  if (!requestCounts[ip]) requestCounts[ip] = [];
  requestCounts[ip] = requestCounts[ip].filter(time => now - time < window);

  if (requestCounts[ip].length >= maxRequests) return true;

  requestCounts[ip].push(now);
  return false;
}

// Verify HMAC signature
function verifyHMAC(payload, signature) {
  const secret = process.env.HMAC_SECRET;
  const hash = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (isRateLimited(ip)) return res.status(429).json({ error: "Too many requests" });

  const { message, signature } = req.body;

  if (!message || typeof message !== "string" || message.length > 2000) {
    return res.status(400).json({ error: "Invalid message" });
  }

  if (!signature || !verifyHMAC({ message }, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook send failed:", err);
    res.status(500).json({ error: "Failed to send webhook" });
  }
}
