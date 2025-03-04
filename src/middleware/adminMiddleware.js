const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    next(); // Proceed to the next middleware if user is an admin
};

module.exports = adminMiddleware;
