const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");

const { getCartData } = require("../middleware/cart");

// Hämta alla beställningar
router.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.orders.findMany();
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
 *  - Response: [{ orderId: 1, userId: 101, orderPrice: 299.99, orderItems: [...] }, ...]
 */
router.get("/orders/:user_id", async (req, res) => {
  const { user_id } = req.params; // Hämtar user_id från URLen

  try {
    const orders = await prisma.orders.findMany({
      // Hittar alla orders som hör till denna user_id
      where: { userId: parseInt(user_id) },
      include: { // Inkluderar orderItems
        orderItems: true,
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


router.post("/orders", async (req, res) => {
  const { userId, token } = req.body;

  // Validate that userId and token are provided
  if (!userId || !token) {
    return res.status(400).json({
      error: "Saknade fält",
      message: "userId och token krävs",
    });
  }

  try {
    // Fetch the user's cart using the getCartData function
    const cartData = await getCartData(userId, token);

    // If cartData is null (empty cart or error in fetch), return error response
    if (!cartData) {
      return res.status(400).json({
        error: "Tom kundvagn",
        message: "Kundvagnen är tom eller felaktig",
      });
    }

    // Calculate the total order price by summing up the total_price of each item in the cart
    const orderPrice = cartData.cart.reduce((sum, item) => sum + item.total_price, 0);

    // Create the new order
    const newOrder = await prisma.orders.create({
      data: {
        userId: userId,
        orderPrice: orderPrice, // Use the calculated order price
        orderItems: {
          create: cartData.cart.map((item) => ({
            product_id: item.product_id,
            amount: item.quantity,
            product_price: item.price,
            product_name: item.product_name,
            total_price: item.total_price,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    // Return the success response with the created order
    res.status(201).json({
      message: "Order skapad",
      order: newOrder,
    });
  } catch (error) {
    console.error("Misslyckades med att skapa beställning:", error);

    // Return error response
    res.status(500).json({
      error: "Misslyckades med att skapa beställning",
      message: error.message,
    });
  }
});

module.exports = router;