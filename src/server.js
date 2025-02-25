const express = require("express");
const cors = require("cors");
const setupSwagger = require('./config/swagger');
const prisma = require("./config/prisma");
require("dotenv").config();

const app = express();
app.use(cors());


setupSwagger(app);
const PORT = process.env.PORT || 8080;
app.use(express.json());

const authenticateToken = require("./middleware/authMiddleware");
const orderRoutes = require("./routes/orderRoutes");
app.use("/api", authenticateToken, orderRoutes);

// Root endpoint med information om API status
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
    try {
        console.log(`Running on http://localhost:${PORT}`);
        console.log('Swagger docs available at http://localhost:8080/api/docs');
    } catch (error) {
        console.log(error.message);
    }
});
