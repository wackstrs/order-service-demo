// Middleware för att säkerställa att användaren har admin-roll
// Används för att skydda endpoints som kräver administratörsbehörighet

const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    next(); // Fortsätt till nästa middleware om användaren är en admin
};

module.exports = adminMiddleware;
