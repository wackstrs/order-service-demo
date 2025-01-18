const express = require('express')
const app = express()

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

require('dotenv').config()
const PORT = process.env.PORT || 8080

console.log(`Node.js ${process.version}`)

app.use(express.json())

// Root endpoint to check database connection
app.get('/', async (req, res) => {
    try {
        // Try to fetch the current time from the database to ensure the connection is working
        const result = await prisma.$queryRaw`SELECT NOW()`; // Corrected to use "prisma"
        res.json({ message: 'Database connection successful', result });
    } catch (error) {
        res.status(500).json({ message: 'Database connection failed', error: error.message });
    }
});

// Endpoint to test fetching data using Prisma
app.get('/prisma', async (req, res) => {
    const test = await prisma.test.findMany()
    res.send({ msg: 'Prisma findMany', test: test })
})

// Default health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send({
        status: 'ok',
        message: 'API is running smoothly',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    })
})

// Start the server
app.listen(PORT, () => {
    try {
        console.log(`Running on http://localhost:${PORT}`)
    } catch (error) {
        console.log(error.message);
    }
})
