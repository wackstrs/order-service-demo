const express = require("express");
const prisma = require("./config/prisma");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

console.log(`Node.js ${process.version}`);

app.use(express.json());

// Import the orderRoutes from orderRoutes.js
const orderRoutes = require("./routes/orderRoutes");
app.use("/api", orderRoutes);

// Root endpoint for API status
app.get("/", async (req, res) => {
    const timestamp = new Date().toISOString();
    try {
        await prisma.$queryRaw`SELECT NOW()`;
        res.status(200).json({
            status: "ok",
            message: "API är igång och ansluten till databasen",
            database_status: "ansluten",
            timestamp: timestamp,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "API är igång men kan inte ansluta till databasen",
            database_status: "ej ansluten",
            error: error.message,
            timestamp: timestamp,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`);
});
