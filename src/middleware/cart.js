const CART_SERVICE_URL = process.env.CART_SERVICE_URL;

const getCartData = async (req, res, next) => {
    const { user_id } = req.body;
    const token = req.headers.authorization?.split(" ")[1]; // Extract token after "Bearer "

    // Step 1: Validate Request Data (user_id and token)
    if (!user_id || !token) {
        return res.status(400).json({
            error: "Saknar user_id och token",
            message: "user_id krävs i body och token måste skickas i Authorization-headern",
        });
    }

    try {
        // Step 2: Fetch Cart Data from Cart Service
        const response = await fetch(`${CART_SERVICE_URL}/cart/${user_id}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Step 3: Handle Cart Service Errors (Non-2xx Responses)
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to fetch cart data: ${errorData.message}`);

            if (response.status === 401) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: errorData.message || "Invalid token"
                });
            }

            return res.status(response.status).json({
                error: errorData.error || "Unknown error",
                message: errorData.message || "An error occurred while fetching cart data."
            });
        }

        // Step 4: Parse the Cart Data
        const cartData = await response.json();

        // Step 5: Handle Empty Cart
        if (!cartData?.cart?.length) {
            return res.status(200).json({
                message: "Cart is empty",
                cart: []
            });
        }

        // Step 6: Attach Cart Data to Request and Proceed
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
