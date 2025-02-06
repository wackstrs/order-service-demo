const checkInventory = async (req, res, next) => {
    // Extract payload from the HTTP client request body
    const { email, items } = req.body;

    if (!email || !items || items.length === 0) {
        return res.status(400).json({
            error: "Invalid Payload",
            message: "Email and items are required.",
        });
    }

    try {
        // Prepare the inventory request based on the data from the HTTP client
        const inventoryRequest = {
            email: email,  // Use email sent from HTTP client
            items: items.map(item => ({
                productCode: item.productCode, // productCode from the client request
                quantity: item.quantity,       // quantity from the client request
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