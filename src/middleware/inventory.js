const INVENTORY_SERVICE_URL = `${process.env.INVENTORY_SERVICE_URL}/inventory/decrease`;

const checkInventory = async (req, res, next) => {
    const cartData = req.cartData; // cartData från föregående middleware
    const user_email = req.body.email; // Get email from request body

    if (!user_email) {
        return res.status(400).json({ error: "Email is required in the request body" });
    }

    try {
        const inventoryRequest = {
            email: user_email,
            items: cartData.cart.map(item => ({
                productCode: String(item.product_id),
                quantity: item.quantity
            })),
        };

        console.log("🛒 Sending Inventory Request Payload:");
        console.log(JSON.stringify(inventoryRequest, null, 2));

        const inventoryResponse = await fetch(INVENTORY_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inventoryRequest),
        });

        if (!inventoryResponse.ok) {
            const errorData = await inventoryResponse.json();
            console.error("❌ Inventory Service Error Response:", errorData);
            return res.status(400).json({
                error: errorData.error || "Uppdatering av lagersaldo misslyckades",
                message: errorData.message || "Går inte att uppdatera lagersaldo",
            });
        }

        console.log("✅ Inventory Check Successful");
        next();

    } catch (error) {
        console.error("🔥 Fel vid kontroll av lager", error);
        return res.status(500).json({
            error: "Internt serverfel",
            message: "Misslyckades med att validera eller uppdatera lagersaldo",
        });
    }
};

module.exports = checkInventory;
