const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL;

// Middleware som kontrollerar och reducerar lagersaldo för varje produkt i kundvagnen
const checkInventory = async (req, res, next) => {
    const cartData = req.cartData; // cartData från föregående middleware

    try {
        // Dynamiskt skapa payload för inventory service baserat på cartData
        const inventoryRequest = {
            email: req.body.email || "order-service@test.com", // Ta email från request body eller använd default
            items: cartData.cart.map(item => ({
                productCode: String(item.product_id), // Använd product_id från cart
                quantity: item.quantity // Använd quantity från cart
            }))
        };

          // Skickar en POST request till inventory service för att minska lagersaldot
          const inventoryResponse = await fetch(INVENTORY_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inventoryRequest),
        });

        // Om responsen från inventory service inte är ok, returnera ett felmeddelande
        if (!inventoryResponse.ok) {
            const errorData = await inventoryResponse.json();
            return res.status(400).json({
                error: errorData.error || "Uppdatering av lagersaldo misslyckades",
                message: errorData.message || "Går inte att uppdatera lagersaldo",
            });
        }

        next(); // Om allt ok, fortsätt till nästa middleware
    } catch (error) {
        console.error(error);

        // Om någonting annat misslyckas, returnera ett felmeddelande
        return res.status(500).json({
            error: "Internt serverfel",
            message: "Misslyckades med att validera eller uppdatera lagersaldo",
        });
    }
};

module.exports = checkInventory;