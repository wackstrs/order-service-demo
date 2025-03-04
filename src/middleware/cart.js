const CART_SERVICE_URL = process.env.CART_SERVICE_URL;

const getCartData = async (req, res, next) => {
    const { shipping_address } = req.body; // Fetch shipping_address from req body

    // Check that shipping_address is not empty
    if (!shipping_address || shipping_address.trim() === '') {
        return res.status(400).json({ message: 'Shipping address is required' });
    }

    const user_id = req.user.sub; // user_id comes from the JWT token (set by authMiddleware)
    const token = req.token; // token comes from the JWT token (set by authMiddleware)

    try {
       // Fetch user's cart
       const response = await fetch(`${CART_SERVICE_URL}/cart/${user_id}`, {
        method: "GET",
        headers: {
            'Authorization': `Bearer ${token}` // Use Bearer token for authorization
        }
    });

        // If the fetch fails, return an error
        if (!response.ok) {
            console.error(`Failed to fetch cart for user ${user_id}`);
            return res.status(response.status).json({
                error: `Failed to fetch cart for user ${user_id}`,
                message: (await response.json()).message || "An error occurred while fetching cart data."
            });
        }

        // Parse the response as JSON
        const cartData = await response.json();

        // Ensure the cartData exists and has items
        if (!cartData || !cartData.cart || !cartData.cart.length) {
            console.error(`No cart found for user ${user_id}`);
            return res.status(200).json({
                message: "The cart is empty.",
                cart: []
            });
        }

        // Attach cartData to the req object for use in subsequent middlewares
        req.cartData = cartData;

        // Store the shipping_address in the request object
        req.shipping_address = shipping_address;

        // Proceed to the next middleware (checkInventory)
        next();

    } catch (error) {
        console.error(`Unexpected error occurred while fetching cart data for user ${user_id}`, error);
        return res.status(500).json({
            error: "Unexpected error",
            message: "An unexpected error occurred while fetching cart data."
        });
    }
};

module.exports = getCartData;
