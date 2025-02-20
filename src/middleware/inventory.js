const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL;

// Middleware som kontrollerar och reducerar lagersaldo för varje produkt i kundvagnen
const checkInventory = async (req, res, next) => {
    const cartData = req.cartData; // cartData från föregående middleware

    try {
        // Payload som ska skickas till inventory service, hårdkodat för tillfället
        const inventoryRequest = {
            email: "order-service@test.com", // Hårdkodat
            items: cartData.cart.map(item => ({
                productCode: String(item.product_id),
                quantity: item.quantity
            })),
        };

        // Skickar en POST request till inventory service för att minska lagersaldot
        const inventoryResponse = await fetch(INVENTORY_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inventoryRequest),
        });

        if (!inventoryResponse.ok) {
            const errorData = await inventoryResponse.json();
            return res.status(400).json({
                error: errorData.error || "Uppdatering av lagersaldo misslyckades",
                message: errorData.message || "Går inte att uppdatera lagersaldo",
            });
        }

        next(); // Om allt är ok, fortsätt till nästa middleware
    } catch (error) {
        console.error("Fel vid kontroll av lager", error);
        return res.status(500).json({
            error: "Internt serverfel",
            message: "Misslyckades med att validera eller uppdatera lagersaldo",
        });
    }
};

module.exports = checkInventory;