import jwt from "jsonwebtoken";

export default function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { deviceId } = req.body;

    if (!deviceId) {
        return res.status(400).json({ error: "Missing deviceId" });
    }

    // Create JWT containing ONLY the deviceId
    const token = jwt.sign(
        { deviceId },
        process.env.JWT_SECRET,
        { expiresIn: "15m" } // 15-minute token
    );

    return res.status(200).json({
        token,
        userId: deviceId
    });
}
