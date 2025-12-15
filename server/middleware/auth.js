// server/middleware/auth.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    try {
        // Header name is commonly "Authorization"
        let token = req.header("Authorization") || req.header("authorization");
        if (!token) {
            return res.status(401).send("Access Denied: No token provided");
        }

        // If header is "Bearer <token>"
        if (token.toLowerCase().startsWith("bearer ")) {
            token = token.slice(7).trimStart();
        }

        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            req.user = verified;
            next();
        } catch (err) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
    } catch (err) {
        console.error("verifyToken error:", err);
        return res.status(500).json({ error: err.message });
    }
}