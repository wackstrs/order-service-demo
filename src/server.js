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
        const test = await prisma.test.findMany()
        res.send({ msg: 'mongodb prisma findMany', test: test })

    } catch (err) {
        
        console.log(err)
        res.send({
            msg: 'ERROR',
            error: err
        })
    }

})

app.get('/prisma', async (req, res) => {
    const test = await prisma.test.findMany()
    res.send({ msg: 'mongodb prisma findMany', test: test })
})

app.listen(PORT, () => {
    try {
        console.log(`Running on http://localhost:${PORT}`)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
    
})