const express = require("express");
const prisma = require("../config/prisma");

const router = express.Router();

// Get all orders
router.get("/orders", async (req, res) => {
    try {
        const orders = await prisma.order.findMany();
        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch orders", message: error.message });
    }
});

// Get a specific order by ID
router.get("/orders/:id", async (req, res) => {
    const orderId = parseInt(req.params.id, 10);

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (order) {
            res.status(200).json(order);
        } else {
            res.status(404).json({ error: "Order not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch order", message: error.message });
    }
});

// Create a new order
router.post("/orders", async (req, res) => {
    const { user_id, products, total_amount } = req.body;

    if (!user_id || !products || !total_amount) {
        return res.status(400).json({
            error: "Missing required fields",
            message: "user_id, products, and total_amount are required",
        });
    }

    try {
        const newOrder = await prisma.order.create({
            data: {
                user_id,
                products: JSON.stringify(products), // Assuming products is an array of objects
                total_amount,
            },
        });
        res.status(201).json(newOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create order", message: error.message });
    }
});

// Update an existing order
router.put("/orders/:id", async (req, res) => {
    const orderId = parseInt(req.params.id, 10);
    const { user_id, products, total_amount } = req.body;

    try {
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                user_id,
                products: JSON.stringify(products),
                total_amount,
            },
        });
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update order", message: error.message });
    }
});

// Delete an order
router.delete("/orders/:id", async (req, res) => {
    const orderId = parseInt(req.params.id, 10);

    try {
        const deletedOrder = await prisma.order.delete({
            where: { id: orderId },
        });

        res.status(200).json({ message: `Order ${orderId} deleted successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete order", message: error.message });
    }
});

module.exports = router;
