const jwt = require('jsonwebtoken');

/**
 * Middleware for verifying JWT token and protecting API endpoints.
 * 
 * @param {Object} req - Express request object where the token can be found
 * @param {Object} res - Express response object to send back responses
 * @param {Function} next - Next middleware or route handler to proceed
 * 
 * @returns {Object} - If token is missing or invalid, returns HTTP 401 or 403
 *                     If token is valid, adds `req.user` and proceeds to the next middleware
 */
function authenticateToken(req, res, next) {
    // First, check the Authorization header for the "Bearer <token>" format
    const authHeader = req.headers.authorization;
    let token = null;

    // Extract token from the Authorization header if it exists
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1]; // Get token after "Bearer "
    }

    // If token is not found in the Authorization header, check for a custom "token" header
    if (!token) {
        token = req.headers["token"];
    }

    // If token is missing entirely, respond with Unauthorized error
    if (!token) {
        return res.status(401).json({ msg: "Access denied. No token provided." });
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach the decoded user data to the request object
        req.token = token;  // Optionally, store the token itself in the request
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error("Token verification error:", err); // Log error for debugging
        return res.status(403).json({ msg: "Invalid or expired token." });
    }
}

module.exports = authenticateToken;