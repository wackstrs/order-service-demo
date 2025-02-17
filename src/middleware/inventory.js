const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL;

// Middleware som kontrollerar och reducerar lagersaldo för varje produkt i kundvagnen
const checkInventory = async (req, res, next) => {
    const cartData = req.cartData; // cartData från föregående middleware

    try {
        // Dynamically create payload for the inventory service based on cartData
        const inventoryRequest = {
            email: req.body.email || "order-service@test.com", // Use email from request body or default
            items: cartData.cart.map(item => ({
                productCode: String(item.product_id), // Use product_id from cart
                quantity: item.quantity // Use quantity from cart
            }))
        };

        // Send POST request to the inventory service to decrease stock
        const inventoryResponse = await fetch(INVENTORY_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inventoryRequest),
        });

        // If response from inventory service is not OK, return an error message
        if (!inventoryResponse.ok) {
            const errorData = await inventoryResponse.json();
            console.error('Error from inventory service:', errorData); // Log entire error data for debugging
            return res.status(400).json({
                error: errorData.error || "Uppdatering av lagersaldo misslyckades",
                message: errorData.message || "Går inte att uppdatera lagersaldo",
            });
        }

        // If everything is OK, proceed to next middleware
        next();
    } catch (error) {
        console.error('Unexpected error:', error);

        // Return an error if something else fails
        return res.status(500).json({
            error: "Internt serverfel",
            message: "Misslyckades med att validera eller uppdatera lagersaldo",
        });
    }
};

module.exports = checkInventory;