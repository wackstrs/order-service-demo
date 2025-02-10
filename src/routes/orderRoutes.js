const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");

// Import middlewares
const getCartData = require("../middleware/cart.js");
const checkInventory = require("../middleware/inventory.js");
const sendOrder = require("../services/sendOrder.js");

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Retrieve all orders
 *     description: Fetches all orders from the database.
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Successfully retrieved orders.
 *         content:
 *           application/json:
 *             example:
 *               - order_id: 1
 *                 user_id: 101
 *                 order_price: 299.99
 *                 order_items:
 *                   - product_id: 1
 *                     product_name: "Hantverksöl IPA"
 *                     quantity: 2
 *                     product_price: 149.99
 *                     total_price: 299.98
 *               - order_id: 2
 *                 user_id: 102
 *                 order_price: 199.99
 *                 order_items:
 *                   - product_id: 2
 *                     product_name: "Lageröl"
 *                     quantity: 1
 *                     product_price: 199.99
 *                     total_price: 199.99
 *       404:
 *         description: No orders found.
 *       500:
 *         description: Server error.
 */


router.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.orders.findMany({
      include: {
        order_items: true,  // Include related order items
      },
    });

    if (orders.length === 0) {
      return res.status(404).json({ error: "Inga ordrar hittades" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Hämtningen misslyckades", message: error.message });
  }
});


/**
 * @swagger
 * /api/orders/{user_id}:
 *   get:
 *     summary: Get orders for a specific user
 *     description: Fetches all orders related to a given user ID.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID to fetch orders for.
 *     responses:
 *       200:
 *         description: Successfully retrieved orders.
 *         content:
 *           application/json:
 *             example:
 *               - order_id: 1
 *                 user_id: 101
 *                 order_price: 499.98
 *                 order_items:
 *                   - product_id: 1
 *                     product_name: "Hantverksöl IPA"
 *                     quantity: 2
 *                     product_price: 149.99
 *                     total_price: 299.98
 *                   - product_id: 2
 *                     product_name: "Lageröl"
 *                     quantity: 1
 *                     product_price: 199.99
 *                     total_price: 199.99
 *       404:
 *         description: No orders found for the given user.
 *       500:
 *         description: Internal server error.
 */


router.get("/orders/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const orders = await prisma.orders.findMany({
      where: { user_id: parseInt(user_id) },
      include: { order_items: true },
    });

    if (orders.length === 0) {
      return res
        .status(404)
        .json({ msg: `No orders found for user with ID: ${user_id}.` });
    }

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Creates an order in the database and sends it to the invoicing service.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               cartData:
 *                 type: object
 *                 properties:
 *                   cart:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         product_id:
 *                           type: integer
 *                         quantity:
 *                           type: integer
 *                         price:
 *                           type: number
 *                         product_name:
 *                           type: string
 *                         total_price:
 *                           type: number
 *           example:
 *             user_id: 101
 *             cartData:
 *               cart:
 *                 - product_id: 1
 *                   product_name: "Hantverksöl IPA"
 *                   quantity: 2
 *                   price: 149.99
 *                   total_price: 299.98
 *     responses:
 *       201:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Order created and sent to invoicing"
 *               order:
 *                 order_id: 1
 *                 user_id: 101
 *                 order_price: 299.99
 *                 order_items:
 *                   - product_id: 1
 *                     product_name: "Hantverksöl IPA"
 *                     quantity: 2
 *                     product_price: 149.99
 *                     total_price: 299.98
 *       500:
 *         description: Failed to create order.
 */

router.post("/orders", getCartData, checkInventory, async (req, res) => {
  const { user_id } = req.body;
  const cartData = req.cartData;

  try {
    const order_price = cartData.cart.reduce((sum, item) => sum + item.total_price, 0);

    const newOrder = await prisma.orders.create({
      data: {
        user_id,
        order_price,
        order_items: {
          create: cartData.cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            product_price: item.price,
            product_name: item.product_name,
            total_price: item.total_price,
          })),
        },
      },
      include: { order_items: true },
    });

    console.log("New order created:", newOrder);

    /* Send order to invoicing-service
    const invoiceResponse = await sendOrder(newOrder);
    if (!invoiceResponse.success) {
        return res.status(500).json({ error: "Failed to send invoice", details: invoiceResponse.error });
    }
    */

    res.status(201).json({ message: "Order created and sent to invoicing", order: newOrder });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order", message: error.message });
  }
});

module.exports = router;
