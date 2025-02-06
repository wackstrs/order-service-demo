const checkInventory = async (req, res, next) => {
    const cartData = req.cartData; // Access the cart data from the previous middleware
  
    try {
      // Prepare payload for inventory service
      const inventoryRequest = {
        email: "order-service@test.com,", // req.user.email, // Assuming user info is available in the request
        items: cartData.cart.map(item => ({
          productCode: "0001", //item.product_id, // Using product_id from cart data
          quantity: 2, //item.quantity,      // Quantity from cart data
        })),
      };
  
      // Send POST request to the inventory service to check and reduce stock
      const inventoryResponse = await fetch("https://dev-inventory-service-inventory-service.2.rahtiapp.fi/inventory/decrease", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryRequest),
      });
  
      // If the inventory service responds with an error (non-2xx status)
      if (!inventoryResponse.ok) {
        const errorData = await inventoryResponse.json();
        return res.status(400).json({
          error: errorData.error || "Inventory Update Failed",
          message: errorData.message || "Unable to update inventory stock",
        });
      }
  
      // If inventory update is successful, proceed to the next middleware
      next();
    } catch (error) {
      console.error("Error communicating with inventory service:", error);
      // Handle network errors, service unavailability, etc.
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to validate or update inventory due to a communication error",
      });
    }
  };
  
  module.exports = checkInventory;