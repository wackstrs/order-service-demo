import jwt from "jsonwebtoken";

/**
 * Middleware för att verifiera JWT-token och skydda API-endpoints.
 *
 * Args:
 *  - req (Object): Express request-objekt, där JWT-token skickas i Authorization-headern
 *  - res (Object): Express response-objekt för att skicka tillbaka svar vid fel
 *  - next (Function): Nästa middleware eller route-handler
 *
 * Returns:
 *  - Om ingen token tillhandahålls → HTTP 401 (Unauthorized)
 *  - Om token är ogiltig eller utgången → HTTP 403 (Forbidden)
 *  - Om token är giltig → Lägger till `req.user` och går vidare till nästa middleware
 *
 * Exempel på användning:
 *  - router.get("/orders/:user_id", authenticateToken, getOrders);
 */
export function authenticateToken(req, res, next) {
    const token = req.headers["authorization"]; // Token skickas i Authorization-headern

    if (!token) {
        return res.status(401).json({ msg: "Åtkomst nekad. Ingen token tillhandahållen." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verifierar token med vår hemliga nyckel
        req.user = decoded; // Lägger till användardata i request-objektet
        next(); 
    } catch (err) {
        return res.status(403).json({ msg: "Ogiltig eller utgången token." });
    }
}