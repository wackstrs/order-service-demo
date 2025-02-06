// Middleware som kontrollerar och reducerar lagersaldo för varje produkt i kundvagnen
const checkInventory = async (req, res, next) => {
    const cartData = req.cartData; // cartData från föregående middleware

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

        // Skickar en POST request till inventory service för att minska lagersaldot
        const inventoryResponse = await fetch("https://dev-inventory-service-inventory-service.2.rahtiapp.fi/inventory/decrease", {
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