const jwt = require('jsonwebtoken');
/**
 * Middleware för att verifiera JWT-token och skydda API-endpoints.
 *
 * @param {Object} req - Express request-objekt, förväntar sig JWT i Authorization-headern.
 * @param {Object} res - Express response-objekt, används för att returnera felmeddelanden.
 * @param {Function} next - Anropar nästa middleware eller route-handler.
 *
 * @returns
 * - 401 Unauthorized om ingen token tillhandahålls.
 * - 403 Forbidden om token är ogiltig eller har gått ut.
 * - Om token är giltig läggs `req.user` och `req.token` till, sedan anropas `next()`.
 *
 * Exempel på användning:
 * - router.get("/orders/:user_id", authenticateToken, getOrders);
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1].trim();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verifiera token
        req.user = decoded; // Spara användarinformation i request-objektet
        req.token = token; // Spara token i request-objektet
        next(); // Fortsätt till nästa middleware
    } catch (err) {
        console.error("Token verification error:", err);
        return res.status(403).json({ msg: "Invalid or expired token." });
    }
}

module.exports = authenticateToken;