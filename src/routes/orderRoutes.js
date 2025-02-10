const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");

// Importera middlewares
const getCartData = require('../middleware/cart.js');
const checkInventory = require('../middleware/inventory.js');
const sendOrder = require("../services/sendOrder.js");

// Hämta alla beställningar (oklart om detta behövs, admin eventuellt?)
router.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.orders.findMany();
    res.status(200).json(orders);

    if (orders.length === 0) {
      return res.status(404).json({ error: "Inga ordrar hittades" });
    }
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
 *  - Response: [{ orderId: 1, userId: 101, orderPrice: 299.99, orderItems: [...] }, ...]
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

router.post("/orders", getCartData, checkInventory, async (req, res) => {
  const { user_id } = req.body;
  const cartData = req.cartData;

  try {
      // Calculate total order price
      const order_price = cartData.cart.reduce((sum, item) => sum + item.total_price, 0);

      // Create new order
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

      console.log("New order created:", newOrder);

      /* Send order to invoicing-service
      const invoiceResponse = await sendOrder(newOrder);
      if (!invoiceResponse.success) {
          return res.status(500).json({ error: "Failed to send invoice", details: invoiceResponse.error });
      }
      */

      // Return success response
      res.status(201).json({ message: "Order created and sent to invoicing", order: newOrder });

  } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order", message: error.message });
  }
});

module.exports = router;