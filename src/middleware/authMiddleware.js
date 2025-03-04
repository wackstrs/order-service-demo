// authMiddleware.js

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization; // Get token from Authorization header

    console.log("Authorization Header:", authHeader);  // Log the token or lack thereof

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized. Token missing or invalid." });
    }

    const token = authHeader.split(" ")[1]; // Extract the actual token

    console.log("Extracted Token:", token); // Log the extracted token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify JWT
        req.user = decoded; // Attach decoded payload to request object
        next(); // Proceed to the next middleware
    } catch (error) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};

module.exports = authMiddleware;
