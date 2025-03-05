const CART_SERVICE_URL = process.env.CART_SERVICE_URL;

const getCartData = async (req, res, next) => {
    const { shipping_address } = req.body; // Fetch shipping_address from req body

    // Check that shipping_address is not empty
    if (!shipping_address || shipping_address.trim() === '') {
        return res.status(400).json({ message: 'Shipping address is required' });
    }

    const user_id = req.user.sub; // user_id comes from the JWT token (set by authMiddleware)
    const token = req.token; // Use the token that was set by authMiddleware

    console.log("User ID:", user_id); // Log user_id for debugging
    console.log("Token:", token); // Log token for debugging

    if (!user_id) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // Hämta kundvagnen för en specifik användare
        const response = await fetch(`${CART_SERVICE_URL}/cart/${user_id}`, {
            method: "GET",
            headers: {
                'token': token // Kommer från JWT token
            }
        });

        // Log the response status code to check if the fetch was successful
        console.log("Cart Service Response Status:", response.status);

        if (!response.ok) {
            console.error(`Failed to fetch cart for user ${user_id}`);
            const errorResponse = await response.json();
            console.error("Error from Cart Service:", errorResponse); // Log error response from cart service
            return res.status(response.status).json({
                error: `Failed to fetch cart for user ${user_id}`,
                message: errorResponse.message || "An error occurred while fetching cart data."
            });
        }

        const cartData = await response.json();
        console.log("Cart Data:", cartData); // Log the cart data

        if (!cartData || !cartData.cart || !cartData.cart.length) {
            console.error(`No cart found for user ${user_id}`);
            return res.status(200).json({
                message: "The cart is empty.",
                cart: []
            });
        }

        req.cartData = cartData;
        req.shipping_address = shipping_address;
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