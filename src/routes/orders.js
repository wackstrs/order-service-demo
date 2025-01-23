const express = require("express");
const router = express.Router();
const prisma = require("../config/prismaClient");

// Route for getting all orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route for creating a new order and storing it in the database
router.post('/orders', async (req, res) => {
  const { description, quantity } = req.body;

  try {
    const newOrder = await prisma.order.create({
      data: {
        description,
        quantity,
        createdAt: new Date(),
      },
    });
    
    res.status(201).json(newOrder);  // Respond with the created order
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
