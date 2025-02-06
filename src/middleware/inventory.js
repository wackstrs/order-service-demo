const checkInventory = async (req, res, next) => {
    const cartData = req.cartData; // This comes from getCartData middleware

    try {
        // Payload som ska skickas till inventory service, hårdkodat för tillfället
        const inventoryRequest = {
            email: "order-service@test.com", // Hårdkodat
            items: [
                {
                    productCode: "0001", // Hårdkodat, ska vara product_id från cart
                    quantity: 1 // Hårdkodat, ska vara quantity från cart
                }
            ]
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
