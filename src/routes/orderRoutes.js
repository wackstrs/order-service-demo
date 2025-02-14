const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");

// Importera middlewares
const getCartData = require('../middleware/cart.js');
const checkInventory = require('../middleware/inventory.js');
const sendOrder = require("../middleware/sendOrder.js");

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Retrieve all orders (Admin access only)
 *     description: Fetches all orders from the database.
 *     tags: [Orders]
 *     parameters:
 *       - in: header
 *         description: The JWT token used for authentication. Required to get orders.
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           description: The JWT token for authentication.
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
router.get("/admin/orders", async (req, res) => {
  const role = req.user.role;

  if (role !== 'admin') {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

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
 * /orders:
 *   get:
 *     summary: Get orders for a specific user
 *     description: Fetches all orders related to a given user ID.
 *     operationId: getOrdersForUser
 *     tags: [Orders]
 *     parameters:
 *       - name: token
 *         in: header
 *         required: true
 *         description: The JWT token used for authentication.
 *         type: string
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
router.get("/orders", async (req, res) => {
  const user_id = req.user.sub; // Hämtar user_id från JWTn

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
 *       - name: token
 *         in: header
 *         description: The JWT token used for authentication. Required for order creation.
 *         required: true
 *         type: string
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
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-02-10T14:30:00Z"
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
 *                   example: "Both user_id and token are required."
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
  const user_id = parseInt(req.user.sub, 10); // Hämtar user_id från req (req.user.sub är en string men sparas som int i vår prisma)
  const cartData = req.cartData; // Hämtar cartData från middleware

  try {
    // Beräkna totalpriset för ordern
    const order_price = cartData.cart.reduce((sum, item) => sum + item.total_price, 0);

    // Skapa order i databasen
    const newOrder = await prisma.orders.create({
      data: {
        user_id,
        order_price,
        order_items: {
          create: cartData.cart.map(item => ({
            product_id: String(item.product_id),
            quantity: item.quantity,
            product_price: item.price,
            product_name: item.product_name,
            total_price: item.total_price,
          })),
        },
      },
      include: { order_items: true },
    });

    // Send the new order to invoice and email
    const orderSent = await sendOrder(newOrder);
    if (!orderSent) {
      throw new Error("Kunde inte skicka beställningen vidare.");
    }

    // Returnera success
    res.status(201).json({
      message: "Order skapad",
      order: newOrder,
    });
  } catch (error) {
    // Returnera error
    res.status(500).json({
      error: "Misslyckades att skapa order",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /admin/delete/{order_id}:
 *   delete:
 *     summary: Delete an order (Admin access only)
 *     description: Deletes an order by its ID. Only accessible by admin users.
 *     operationId: deleteOrder
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: order_id
 *         in: path
 *         description: The ID of the order to delete
 *         required: true
 *         type: integer
 *       - name: token
 *         in: header
 *         description: The JWT token used for authentication. Required for admin access.
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successfully deleted order
 *         schema:
 *           type: object
 *           properties:
 *             msg:
 *               type: string
 *               example: "Successfully deleted order with ID: 123"
 *       403:
 *         description: Access denied. Admins only.
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Access denied. Admins only."
 *       500:
 *         description: Failed to delete order
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Failed to delete order"
 *             message:
 *               type: string
 *               example: "Detailed error message"
 */

router.delete('/admin/delete/:order_id', async (req, res) => {
  const { order_id } = req.params; // Hämtar order_id från URLen

  // Kollar om användaren är en admin via dens JWT token
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  try {
    await prisma.orders.delete({
      where: { order_id: parseInt(order_id) }
    });

    res.status(200).json({ msg: `Successfully deleted order with ID: ${order_id}` });
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete order",
      message: error.message,
    });
  }
})

module.exports = router;