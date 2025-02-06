const checkInventory = async (req, res, next) => {
    const cartData = req.cartData; // This comes from getCartData middleware

    if (!cartData || !cartData.cart || cartData.cart.length === 0) {
        return res.status(400).json({
            error: "Invalid Cart",
            message: "Cart data is missing or empty.",
        });
    }

    try {
        // Prepare inventory request from cart data
        const inventoryRequest = {
            email: "order-service@test.com", // Hardcoded for testing
            items: cartData.cart.map(item => ({
                productCode: item.product_id,  // Use product_id from cart data
                quantity: item.quantity,      // Use quantity from cart data
            })),
        };

        // Send request to inventory service
        const inventoryResponse = await fetch("https://dev-inventory-service-inventory-service.2.rahtiapp.fi/inventory/decrease", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inventoryRequest),
        });

        if (!inventoryResponse.ok) {
            const errorData = await inventoryResponse.json();
            return res.status(400).json({
                error: errorData.error || "Inventory Update Failed",
                message: errorData.message || "Unable to update inventory stock",
            });
        }

        next(); // Proceed to next step in the order process
    } catch (error) {
        console.error("Error communicating with inventory service:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to validate or update inventory due to a communication error",
        });
    }
};

module.exports = checkInventory;
