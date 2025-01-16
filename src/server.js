const express = require('express')
const app = express()

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

require('dotenv').config()
const PORT = process.env.PORT || 8080

console.log(`Node.js ${process.version}`)

app.use(express.json())

app.get('/', async (req, res) => {
    try {
        const tests = await prisma.test.findMany()  // Assuming 'test' is a model in your schema
        res.send({ msg: 'PostgreSQL prisma findMany', tests: tests })

    } catch (err) {
        console.log(err)
        res.status(500).send({
            msg: 'ERROR',
            error: err.message
        })
    }
})

app.get('/prisma', async (req, res) => {
    try {
        const tests = await prisma.test.findMany()
        res.send({ msg: 'PostgreSQL prisma findMany', tests: tests })
    } catch (err) {
        console.log(err)
        res.status(500).send({
            msg: 'ERROR',
            error: err.message
        })
    }
})

app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`)
})
