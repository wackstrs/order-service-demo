const INVENTORY_SERVICE_URL = `${process.env.INVENTORY_SERVICE_URL}/inventory/decrease`;

const checkInventory = async (req, res, next) => {
    const cartData = req.cartData; 
    const user_email = req.body.email; 

    const token = process.env.ORDER_SERVICE_USER_AUTH_TOKEN || req.token;

    if (!user_email) {
        return res.status(400).json({ error: "Email is required in the request body" });
    }

    if (!token) {
        return res.status(500).json({
            error: "Missing authentication token",
            message: "Inventory service requires an authentication token"
        });
    }

    try {
        const inventoryRequest = {
            email: user_email,
            items: cartData.cart.map(item => ({
                productCode: String(item.product_id),
                quantity: item.quantity
            })),
        };

        console.log("🛒 Sending Inventory Request Payload:", JSON.stringify(inventoryRequest, null, 2));

        const inventoryResponse = await fetch(INVENTORY_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.trim()}` // Include token in headers
            },
            body: JSON.stringify(inventoryRequest),
        });

        if (!inventoryResponse.ok) {
            const errorData = await inventoryResponse.json();
            console.error("❌ Inventory Service Error Response:", errorData);
            return res.status(400).json({
                error: errorData.error || "Failed to update inventory",
                message: errorData.message || "Could not update stock levels",
            });
        }

        console.log("✅ Inventory Check Successful");
        next();

    } catch (error) {
        console.error("🔥 Error checking inventory", error);
        return res.status(500).json({
            error: "Internal server error",
            message: "Failed to validate or update inventory stock",
        });
    }
};

module.exports = checkInventory;
