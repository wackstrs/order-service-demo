const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");

// Importera middlewares
const getCartData = require('../middleware/cart.js');
const checkInventory = require('../middleware/inventory.js');
const sendOrder = require('../middleware/sendOrder.js');

/**
 * @swagger
 * /orders:
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
        order_items: true,
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
 * Hämtar alla ordrar för en specifik användare.
 * 
 * Args:
 *  - user_id (int): Unikt user_id som hämtas från URL-parametern
 * 
 * Returns:
 *  - (Array | Object): En lista med ordrar inklusive orderdetaljer om de finns
 *  - (Object): Ett felmeddelande om inga ordrar hittas eller om ett serverfel uppstår
 * 
 * Exempel:
 *  - GET /orders/101
 *  - Response: [{ order_id: 1, user_id: 101, order_price: 299.99, order_items: [...] }, ...]
 */

/**
 * @swagger
 * /orders/{user_id}:
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
  const { user_id } = req.params; // Hämtar user_id från URLen

  try {
    const orders = await prisma.orders.findMany({
      // Hittar alla orders som hör till denna user_id
      where: { user_id: parseInt(user_id) },
      include: { // Inkluderar orderItems
        order_items: true,
      },
    });

    if (orders.length === 0) {
      // Om användaren inte har någon order
      return res
        .status(404)
        .json({ msg: `No orders found for user with ID: ${user_id}.` });
    }

    // Om allt ok, returnerar orders
    res.status(200).json(orders);
  } catch (err) { // Om någonting misslyckas, returnera error kod 500
    console.error("Error fetching orders:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: Fetches cart data, checks inventory, and creates an order.
 *     operationId: createOrder
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         description: "JWT token for authorization. Format: 'Bearer <token>'"
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order created successfully"
 *                 order:
 *                   type: object
 *                   properties:
 *                     order_id:
 *                       type: integer
 *                       example: 12345
 *                     user_id:
 *                       type: integer
 *                       example: 3
 *                     order_price:
 *                       type: number
 *                       format: float
 *                       example: 199.99
 *                     order_items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_id:
 *                             type: integer
 *                             example: 101
 *                           product_name:
 *                             type: string
 *                             example: "Craft Beer 500ml"
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           product_price:
 *                             type: number
 *                             format: float
 *                             example: 49.99
 *                           total_price:
 *                             type: number
 *                             format: float
 *                             example: 99.98
 *       400:
 *         description: Missing user_id or token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing user_id or token"
 *                 message:
 *                   type: string
 *                   example: "user_id is required in the body and token must be sent in the Authorization header"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create order"
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred while creating the order"
 */
router.post("/orders", getCartData, checkInventory, async (req, res) => {
  const { user_id } = req.body; // Extract user_id from request body
  const cartData = req.cartData; // Extract cartData from middleware

  try {
    // Calculate total order price
    const order_price = cartData.cart.reduce((sum, item) => sum + item.total_price, 0);

    // Create order in database
    const newOrder = await prisma.orders.create({
      data: {
        user_id,
        order_price,
        order_items: {
          create: cartData.cart.map(item => ({
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

    /* Uncomment this when order should be forwarded to invoice and email services

    const orderSent = await sendOrder(newOrder);
    console.log(orderSent);
    if (!orderSent) {
      throw new Error("Failed to forward the order.");
    }

    */

    // Return success response
    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to create order",
      message: error.message,
    });
  }
});

module.exports = router;
