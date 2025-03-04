const INVENTORY_SERVICE_URL = `${process.env.INVENTORY_SERVICE_URL}/inventory/decrease`;

// Middleware som kontrollerar och reducerar lagersaldo för varje produkt i kundvagnen
const checkInventory = async (req, res, next) => {
    const cartData = req.cartData; // cartData från föregående middleware
    const user_email = req.user.email; // email från req
    const token = req.token; // Use the token that was set by authMiddleware

    try {
        const inventoryRequest = {
            email: user_email,
            items: cartData.cart.map(item => ({
                productCode: String(item.product_id),
                quantity: item.quantity
            })),
        };

        console.log("Sending to inventory-service...:", JSON.stringify(inventoryRequest, null, 2));

        // Skickar en POST request till inventory service för att minska lagersaldot
        const inventoryResponse = await fetch(INVENTORY_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(inventoryRequest),
        });

        // Om responsen från inventory service inte är OK, hantera fel baserat på statuskod
        if (!inventoryResponse.ok) {

            // Parse JSON response för att få error details
            let errorData = {};
            try {
                errorData = await inventoryResponse.json();
            } catch (err) { // Om parsing misslyckas (invalid JSON), logga errorn
                console.error("Failed to parse inventory service response:", err);
                errorData = { 
                    error: "Invalid JSON response",
                    detail: "The response from the inventory service could not be parsed as JSON." 
                };
            }

            if (inventoryResponse.status === 404) {
                return res.status(404).json({
                    error: "Produkten hittades inte",
                    message: errorData.detail || "En eller flera produkter saknas i lagret",
                });
            }

            if (inventoryResponse.status === 400) {
                return res.status(400).json({
                    error: "Otillräckligt lagersaldo",
                    message: errorData.detail || "Det finns inte tillräckligt med produkter i lager",
                })
            }

            // Fallback för andra fel
            return res.status(inventoryResponse.status).json({
                error: errorData.error || "Lageruppdatering misslyckades",
                message: errorData.detail || "Ett okänt fel inträffade vid uppdatering av lagersaldo",
            });
        }

        console.log("Inventory check successful");
        next(); // Om allt ok, fortsätt till nästa middleware
    } catch (error) {
        console.error("Error checking inventory", error);
        return res.status(500).json({
            error: "Internal server error",
            message: "Failed to validate or update inventory stock",
        });
    }
};

module.exports = checkInventory;