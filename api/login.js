import jwt from "jsonwebtoken";

export default function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { username } = req.query; // Photon sends this automatically

    if (!username) {
        return res.status(400).json({ error: "Missing username/deviceId" });
    }

    const token = jwt.sign(
        { deviceId: username },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    return res.status(200).json({
        UserId: username,
        token: token
    });
}
