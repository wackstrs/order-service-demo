const express = require("express");
const prisma = require("../config/prisma"); // Ensure the path is correct
const router = express.Router();

// Get all orders
router.get("/orders", async (req, res) => {
    try {
        const orders = await prisma.order.findMany();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch orders", message: error.message });
    }
});

// Get an order by ID
router.get("/orders/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch order", message: error.message });
    }
});

// Create a new order
router.post("/orders", async (req, res) => {
    const { userId, products, totalAmount } = req.body;
    try {
        const newOrder = await prisma.order.create({
            data: { userId, products, totalAmount },
        });
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ error: "Failed to create order", message: error.message });
    }
});

// Update an existing order
router.put("/orders/:id", async (req, res) => {
    const { id } = req.params;
    const { products, totalAmount } = req.body;
    try {
        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: { products, totalAmount },
        });
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: "Failed to update order", message: error.message });
    }
});

// Delete an order
router.delete("/orders/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.order.delete({ where: { id: parseInt(id) } });
        res.status(204).send(); // No content
    } catch (error) {
        res.status(500).json({ error: "Failed to delete order", message: error.message });
    }
});

module.exports = router;
