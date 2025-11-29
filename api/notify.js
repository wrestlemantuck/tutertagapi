import fetch from "node-fetch";

const requestCounts = {};

function isRateLimited(ip) {
  const now = Date.now();
  const window = 60000;
  const maxRequests = 5;

  if (!requestCounts[ip]) requestCounts[ip] = [];
  requestCounts[ip] = requestCounts[ip].filter(time => now - time < window);

  if (requestCounts[ip].length >= maxRequests) return true;

  requestCounts[ip].push(now);
  return false;
}

// Verify PlayFab session token
async function verifyPlayFabToken(playerId, sessionTicket) {
  const response = await fetch("https://103C94.playfabapi.com/Server/AuthenticateSessionTicket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      SessionTicket: sessionTicket
    })
  });

  const data = await response.json();
  return data?.data?.PlayerId === playerId;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (isRateLimited(ip)) return res.status(429).json({ error: "Too many requests" });

  const { message, playerId, sessionTicket } = req.body;

  if (!message || typeof message !== "string" || message.length > 2000)
    return res.status(400).json({ error: "Invalid message" });

  if (!playerId || !sessionTicket)
    return res.status(400).json({ error: "Missing player info" });

  const verified = await verifyPlayFabToken(playerId, sessionTicket);
  if (!verified) return res.status(401).json({ error: "Invalid session" });

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `PlayerID: ${playerId}\nMessage: ${message}` }),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook send failed:", err);
    res.status(500).json({ error: "Failed to send webhook" });
  }
}
