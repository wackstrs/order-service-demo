const CART_SERVICE_URL = process.env.CART_SERVICE_URL;



const getCartData = async (req, res, next) => {
    const { user_id, token } = req.body; // user_id och token kommer från JWT via front-end till vår /orders POST

    if (!user_id || !token) {
        return res.status(400).json({
            error: "Saknar userId och token",
            message: "userId och token krävs för att hämta kundvagnsdata",
        });
    }

    try {
        // 
        const response = await fetch(`${CART_SERVICE_URL}/cart/${userId}`, {
            method: "GET",
            headers: {
                'token': token // Kommer från JWT token
            }
        });

        if (!response.ok) { // Om fetchen misslyckas
            console.error('Failed to fetch cart data');
            return null;
        }

        // Får cartData i JSON format
        const cartData = await response.json();

        // Kollar att cartData existerar och inte är tom
        if (!cartData || !cartData.cart || cartData.cart.length === 0) {
            console.error('Cart is empty or invalid');
            return null;
        }

        // Lägg till cartData i request objektet för att användas i nästa middleware
        req.cartData = cartData;

        // Fortsätt till nästa middleware (checkInventory)
        next();
    } catch (error) { // Om något går fel...
        console.error('Error fetching cart data:', error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to fetch cart data",
        });
    }
};

module.exports = getCartData;