import jwt from "jsonwebtoken";

export default function handler(req, res) {
    const { username, token } = req.query; // Photon sends these as query params

    if (!username) {
        return res.status(400).json({ error: "Missing username/deviceId" });
    }

    // Optionally, you could validate the token here if you want
    // For now, we just issue a new JWT

    const newToken = jwt.sign(
        { deviceId: username },
        process.env.JWT_SECRET,
        { expiresIn: "15m" } // 15-minute token
    );

    // Photon requires at least UserId in the response
    return res.status(200).json({
        UserId: username, // Photon uses this to identify the player
        token: newToken
    });
}
