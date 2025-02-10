const CART_SERVICE_URL = process.env.CART_SERVICE_URL;



const getCartData = async (req, res, next) => {
    const { user_id, token } = req.body; // user_id och token kommer från JWT via front-end till vår /orders POST

    if (!user_id || !token) {
        return res.status(400).json({
            error: "Saknar user_id och token",
            message: "user_id och token krävs för att hämta kundvagnsdata",
        });
    }

    try {
        // 
        const response = await fetch(`${CART_SERVICE_URL}/cart/${user_id}`, {
            method: "GET",
            headers: {
                'token': token // Kommer från JWT token
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch cart data');
            return res.status(404).json({
                error: "Cart Not Found",
                message: "No cart found for this user.",
            });
        }

        // Får cartData i JSON format
        const cartData = await response.json();

       // Handle empty cart explicitly
       if (!cartData || !cartData.cart || cartData.cart.length === 0) {
        console.error('Cart is empty');
        return res.status(200).json({
            message: "Cart is empty",  // Return early and prevent order creation
            cart: []  // Return an empty cart as response
        });
    }

    // Proceed with the next middleware if the cart is not empty
    req.cartData = cartData;
    next();

} catch (error) {
    console.error('Error fetching cart data:', error);
    return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch cart data",
    });
}
};

module.exports = getCartData;