// Middleware som verifierar JWT-token och dekrypterar användardata

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization; // Hämta token från Authorization-headern

    // Kontrollera om token saknas eller är felaktig
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized. Token missing or invalid." });
    }

    const token = authHeader.split(" ")[1]; // Extrahera token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verifiera JWT-token
        req.user = decoded; // Spara det avkodade JWT-innehållet i req-objektet
        req.token = token; // Spara token i req-objektet för användning i andra middleware
        next(); // Fortsätt till nästa middleware om token är giltig
    } catch (error) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};

module.exports = authMiddleware;
