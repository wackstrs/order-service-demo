const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 8080;

console.log(`Node.js ${process.version}`);

app.use(express.json());

const orderRoutes = require("./routes/orders");

app.use("/api", orderRoutes);

app.get('/', async (req, res) => {
    const timestamp = new Date().toISOString();
    try {
      await prisma.$queryRaw`SELECT NOW()`;  
      res.status(200).json({
        status: "ok",
        message: "API and Database are running",
        timestamp: timestamp,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "API is running, but unable to connect to the database",
        database_status: "disconnected",
        error: error.message,
        timestamp: timestamp,
      });
    }
  });


app.listen(PORT, () => {
  try {
    console.log(`Running on http://localhost:${PORT}`);
  } catch (error) {
    console.log(error.message);
  }
});
