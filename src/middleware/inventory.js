const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL;

// Middleware som kontrollerar och reducerar lagersaldo för varje produkt i kundvagnen
const checkInventory = async (req, res, next) => {
    const cartData = req.cartData; // cartData from previous middleware

    try {
        // Prepare a list of product codes and quantities
        const itemsToValidate = cartData.cart.map(item => ({
            productCode: String(item.product_id), // product_id from cart
            quantity: item.quantity // quantity from cart
        }));

        // Perform a batch validation by checking stock for all items
        const inventoryValidationResponse = await fetch(INVENTORY_SERVICE_URL + '/inventory/decrease', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: req.body.email || "order-service@test.com", // email from request body or default
                items: itemsToValidate
            }),
        });

        // If any product does not have enough stock, return an error
        if (!inventoryValidationResponse.ok) {
            const errorData = await inventoryValidationResponse.json();
            console.error('Error from inventory service:', errorData); // Log full error for debugging

            return res.status(400).json({
                error: errorData.error || "Stock update failed",
                message: errorData.message || "Unable to update stock, insufficient stock for one or more items",
            });
        }

        // If all validation passed, continue to the next middleware
        next();
    } catch (error) {
        console.error('Unexpected error:', error);

        // Handle unexpected errors
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to validate or update stock",
        });
    }
};

module.exports = checkInventory;