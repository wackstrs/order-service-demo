const CART_SERVICE_URL = process.env.CART_SERVICE_URL;

// Middleware för att hämta kundvagnsdata
const getCartData = async (req, res, next) => {
    const { shipping_address } = req.body; // Hämta leveransadress från request body

    // Kontrollera att leveransadressen inte är tom
    if (!shipping_address || shipping_address.trim() === '') {
        return res.status(400).json({ message: 'Shipping address is required' });
    }

    const user_id = req.user.sub; // user_id kommer från JWTn
    const token = req.token; // Får token från middleware

    if (!user_id) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
         // Hämta kundvagnen för en specifik användare
        console.log(`Fetching cart for user ${user_id}...`);
        const response = await fetch(`${CART_SERVICE_URL}/cart/${user_id}`, {
            method: "GET",
            headers: {
                'token': token // Skickar JWT-token i headern
            }
        });

        // Kontrollera om hämtningen lyckades
        if (!response.ok) {
            console.error(`Failed to fetch cart for user ${user_id}`);
            const errorResponse = await response.json();
            console.error("Error from Cart Service:", errorResponse);
            return res.status(response.status).json({
                error: `Failed to fetch cart for user ${user_id}`,
                message: errorResponse.message || "An error occurred while fetching cart data."
            });
        }

       // Får cartData i JSON format
       const cartData = await response.json();

        console.log("Cart Data Fetched - OK");

        // Kontrollera om kundvagnen är tom
        if (!cartData || !cartData.cart || !cartData.cart.length) {
            console.error(`No cart found for user ${user_id}`);
            return res.status(200).json({
                message: "The cart is empty.",
                cart: []
            });
        }

        req.cartData = cartData; // Spara kundvagnsdata i request-objektet
        req.shipping_address = shipping_address; // Spara leveransadress i request-objektet
        next(); // Gå vidare till nästa middleware

    } catch (error) {
        console.error(`Unexpected error occurred while fetching cart data for user ${user_id}`, error);
        return res.status(500).json({
            error: "Unexpected error",
            message: "An unexpected error occurred while fetching cart data."
        });
    }
};

module.exports = getCartData;