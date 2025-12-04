export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Parse request body ---
  const { message, playerId } = req.body;

  if (!message || typeof message !== "string" || message.length > 2000) {
    return res.status(400).json({ error: "Invalid message" });
  }

  if (!playerId) {
    return res.status(400).json({ error: "Missing playerId" });
  }

  try {
    // --- Check profile ---
    const profileResp = await fetch(
      "https://103C94.playfabapi.com/Server/GetPlayerProfile",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SecretKey": process.env.PLAYFAB_SECRET_KEY
        },
        body: JSON.stringify({ PlayFabId: playerId })
      }
    );

    const profileData = await profileResp.json();

    if (!profileData.data) {
      return res.status(401).json({ error: "Invalid PlayerId" });
    }

    // --- Check bans ---
    const banResp = await fetch(
      "https://103C94.playfabapi.com/Server/GetUserBans",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SecretKey": process.env.PLAYFAB_SECRET_KEY
        },
        body: JSON.stringify({ PlayFabId: playerId })
      }
    );

    const banData = await banResp.json();

    const bans = banData.data?.Bans || [];

    const activeBans = bans.filter(b => {
      if (b.Active) return true;
      if (b.EndTime) {
        const end = new Date(b.EndTime).getTime();
        return end > Date.now();
      }
      return false;
    });

    if (activeBans.length > 0) {
      return res.status(403).json({ error: "Player is banned" });
    }

    // --- Discord ---
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      return res.status(500).json({ error: "Discord webhook not configured" });
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `Request From PlayerID: ${playerId}\nMessage: ${message}`
      })
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
