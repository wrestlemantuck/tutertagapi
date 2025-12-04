export default async function handler(req, res) {
  try {
    const { message, playerId } = req.body || {};

    // Quick validation
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }
    if (!playerId) {
      return res.status(400).json({ error: "Missing playerId" });
    }

    // DEBUG: confirm handler runs
    console.log("DEBUG: Handler reached. PlayerId:", playerId);

    // --- Check PlayFab bans ---
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

    // DEBUG: log the full PlayFab ban response
    console.log("DEBUG BAN RESPONSE:", JSON.stringify(banData, null, 2));

    // Return the PlayFab response for inspection
    return res.status(200).json({
      debug: true,
      banData
    });

  } catch (err) {
    console.error("DEBUG ERROR:", err);
    return res.status(500).json({
      error: "internal error",
      err: String(err)
    });
  }
}

