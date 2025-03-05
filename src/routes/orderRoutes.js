const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");

// Importera middlewares
const adminMiddleware = require("../middleware/adminMiddleware.js");
const getCartData = require('../middleware/cart.js');
const getProductData = require('../middleware/product.js');
const checkInventory = require('../middleware/inventory.js');
const sendOrder = require("../middleware/sendOrder.js");

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Retrieve all orders (Admin access only)
 *     description: Fetches all orders along with their order items. Only accessible by admin users.
 *     operationId: getAllOrders
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication (admin only)
 *     responses:
 *       200:
 *         description: Successfully retrieved orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   order_id:
 *                     type: integer
 *                     example: 123
 *                   user_id:
 *                     type: integer
 *                     example: 18
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-03-01T12:34:56Z"
 *                   order_items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         product_id:
 *                           type: integer
 *                           example: 456
 *                         quantity:
 *                           type: integer
 *                           example: 2
 *                         price:
 *                           type: number
 *                           format: float
 *                           example: 19.99
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin. Admin role required.
 *       404:
 *         description: No orders found - There are no orders in the system.
 *       500:
 *         description: Internal server error - Error while retrieving orders
 */


router.get("/admin/orders", adminMiddleware, async (req, res) => {
  try {
    // Fetch orders including the order items
    const orders = await prisma.orders.findMany({
      include: { order_items: true },
    });

    // If no orders are found, return a 404 error
    if (orders.length === 0) {
      return res.status(404).json({ error: "No orders found." });
    }

    // Return the orders with a 200 status
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve orders.", message: error.message });
  }
});


/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get orders for a specific user
 *     description: Fetches all orders related to a given user ID, which is extracted from the JWT token.
 *     operationId: getOrdersForUser
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []  # This specifies the bearer token authentication
 *     responses:
 *       200:
 *         description: Successfully retrieved orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   order_id:
 *                     type: integer
 *                     example: 20
 *                   user_id:
 *                     type: integer
 *                     example: 101
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-03-03T17:07:12.701Z"  # Adjusted to your timestamp format
 *                   order_price:
 *                     type: string
 *                     example: "11"
 *                   shipping_address:
 *                     type: string
 *                     example: "123 Main St, City, Country, ZIP"
 *                   order_items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         order_item_id:
 *                           type: integer
 *                           example: 48
 *                         order_id:
 *                           type: integer
 *                           example: 20
 *                         product_id:
 *                           type: string
 *                           example: "10000-FIL"
 *                         product_name:
 *                           type: string
 *                           example: "Karhu 4,6%"
 *                         quantity:
 *                           type: integer
 *                           example: 1
 *                         product_price:
 *                           type: string
 *                           example: "11"
 *                         total_price:
 *                           type: string
 *                           example: "11"
 *                         product_description:
 *                           type: string
 *                           example: "Gulbrun, medelfyllig, medelstor humlebeska, lätt maltighet, fruktig"
 *                         product_image:
 *                           type: string
 *                           example: "/uploads/1740587181163-karhu-46-burk.jpg"
 *                         product_country:
 *                           type: string
 *                           example: "Finland"
 *                         product_category:
 *                           type: string
 *                           example: "Lager"
 *       404:
 *         description: No orders found for the given user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No orders found for the user."
 *                 message:
 *                   type: string
 *                   example: "The user has no orders."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve orders."
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred while retrieving orders."
 */

router.get("/orders", async (req, res) => {
  const user_id = req.user.sub; // Hämtar user_id från JWTn

  try {
    // Fetch all orders for the user
    const orders = await prisma.orders.findMany({
      where: { user_id: parseInt(user_id) },
      include: {
        order_items: true,
      },
    });

    // If no orders are found for the user
    if (orders.length === 0) {
      return res.status(404).json({
        msg: `No orders found for user with ID: ${user_id}.`,
      });
    }

    // Return the orders
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);

    // Handle unexpected errors
    res.status(500).json({
      msg: "Internal server error",
      error: err.message,  // Optionally send detailed error message in response
    });
  }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: Fetches cart data, gets product data, checks inventory, creates an order, and attempts to send order data to the invoicing and email services.
 *     operationId: createOrder
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shipping_address:
 *                 type: string
 *                 example: "123 Main St, City, Country"
 *             required:
 *               - shipping_address
 *     responses:
 *       201:
 *         description: Order created successfully, but invoicing and/or email services may have failed.
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
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-02-10T14:30:00Z"
 *                     order_price:
 *                       type: number
 *                       format: float
 *                       example: 12.58
 *                     shipping_address:
 *                       type: string
 *                       example: "Jan-Magnus Janssons plats 1, Helsingfors, Finland, 00560"
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
 *                             example: 6.29
 *                           total_price:
 *                             type: number
 *                             format: float
 *                             example: 12.58
 *                 invoiceStatus:
 *                   type: string
 *                   enum: [success, failed]
 *                   example: "failed"
 *                 invoiceMessage:
 *                   type: string
 *                   example: "Failed to send order data to invoicing."
 *                 emailStatus:
 *                   type: string
 *                   enum: [success, failed]
 *                   example: "success"
 *                 emailMessage:
 *                   type: string
 *                   example: "Order sent to email successfully."
 *       400:
 *         description: Bad Request (Missing shipping address or insufficient stock)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Shipping address is required"
 *                 message:
 *                   type: string
 *                   example: "Shipping address is required"
 *               oneOf:
 *                 - properties:
 *                     error:
 *                       type: string
 *                       example: "Insufficient stock"
 *                     message:
 *                       type: string
 *                       example: "There is not enough stock for the requested product."
 *       401:
 *         description: Missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access denied. No token provided."
 *       404:
 *         description: Product not found in stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Product not found."
 *                 message:
 *                   type: string
 *                   example: "One or more products not found in stock."
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
 *     security:
 *       - bearerAuth: []  # Add this section to indicate that the API requires authorization with a bearer token.
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


router.post("/orders", getCartData, getProductData, checkInventory, async (req, res) => {
  const user_id = parseInt(req.user.sub, 10); // Get user_id from req.user (set by authMiddleware)
  const cartData = req.cartData; // Gets cartData from getCartData middleware
  const shipping_address = req.shipping_address; // Gets shipping_address from cart.js
  const token = req.token; // Get token from req (set by authMiddleware)

  try {
    // Calculate the total price of the order
    const order_price = cartData.cart.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    const formattedOrderPrice = parseFloat(order_price.toFixed(2));

    // --- CREATE ORDER IN THE DATABASE ---
    const newOrder = await prisma.orders.create({
      data: {
        user_id,
        order_price: formattedOrderPrice,
        shipping_address,
        order_items: {
          create: cartData.cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            product_price: parseFloat(item.product_price.toFixed(2)),
            total_price: parseFloat(item.total_price.toFixed(2)),
            product_name: item.product_name,
            product_description: item.product_description,
            product_image: item.product_image,
            product_country: item.product_country,
            product_category: item.product_category
          })),
        },
      },
      include: { order_items: true },
    });

    // Send the newOrder to sendOrder and get back invoice and email status
    const { invoiceStatus, invoiceMessage, emailStatus, emailMessage } = await sendOrder(newOrder, token); // Pass the token here


    // Return success with invoice and email status
    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
      invoiceStatus,
      invoiceMessage,
      emailStatus,
      emailMessage,
    });

  } catch (error) {
    // Return error if something fails
    res.status(500).json({
      error: "Failed to create order",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /admin/delete/{order_id}:
 *   delete:
 *     summary: Delete an order (Admin access only)
 *     description: Deletes an order by its ID. Only accessible by admin users. The order is identified by the `order_id` path parameter.
 *     operationId: deleteOrder
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication (admin only)
 *     parameters:
 *       - name: order_id
 *         in: path
 *         description: The ID of the order to delete. This should be a valid integer representing the order's ID.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 123  # Example ID to be deleted
 *     responses:
 *       200:
 *         description: Successfully deleted order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully deleted order with ID: 123"
 *       400:
 *         description: Bad Request - Invalid order ID format
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Order not found - The order ID does not exist in the system
 *       500:
 *         description: Internal server error while deleting the order
 */


router.delete("/admin/delete/:order_id", adminMiddleware, async (req, res) => {
  const { order_id } = req.params; // Extract order ID from URL

  try {
      // Ensure the order_id is a valid integer
      const parsedOrderId = parseInt(order_id);
      if (isNaN(parsedOrderId)) {
          return res.status(400).json({ error: "Invalid order ID." });
      }

      // Check if the order exists
      const order = await prisma.orders.findUnique({
          where: { order_id: parsedOrderId }
      });

      if (!order) {
          return res.status(404).json({ error: `Order #${order_id} does not exist.` });
      }

      // Delete order
      await prisma.orders.delete({
          where: { order_id: parsedOrderId }
      });

      res.status(200).json({ message: `Successfully deleted order with ID: ${order_id}` });

  } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Failed to delete order", message: error.message });
  }
});


module.exports = router;