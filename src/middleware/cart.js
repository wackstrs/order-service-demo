const CART_SERVICE_URL = process.env.CART_SERVICE_URL;

/**
 * Hämtar kundvagnen för en specifik användare från API:n.
 * 
 * Args:
 *  - userId (int): Unik user_id
 *  - token (string): Giltig JWT token
 * 
 * Returns:
 *  - (Object | null): Ett objekt med kundvagnsdata om anropet lyckas, annars `null`
 * 
 * Exempel: 
 *  - const cartData = await getCartData(3, 'din-jwt-token');
 *  - console.log(cartData);
 */

const getCartData = async (req, res, next) => {
    const user_id = req.user.sub; // user_id kommer från JWTn
    const token = req.token; // Får token från middleware

    if (!user_id) {
        return res.status(400).json({
            error: "Saknar user_id",
            message: "user_id krävs för att hämta kundvagnsdata",
        });
    }

    try {
        // Hämta kundvagnen för en specifik användare
        const response = await fetch(`${CART_SERVICE_URL}/cart/${user_id}`, {
            method: "GET",
            headers: {
                'token': token // Kommer från JWT token
            }
        });

        // Får cartData i JSON format
        const cartData = await response.json();

        // Om hämtningen misslyckas
        if (!response.ok) {
            console.error(`Misslyckades med att hämta kundvagns för användare ${user_id}`);
            return res.status(response.status).json({
                error: `Misslyckades att hämta kundvagn för användare ${user_id}`,
                message: cartData.message || "Ett fel uppstod vid hämtning av kundvagnsdata",
            });
        }

        // Kollar att cartData existerar och inte är tom
        if (!cartData || !cartData.cart || !cartData.cart.length) {
            console.warn(`Ingen kundvagn hittades för användare ${user_id}`);
            return res.status(200).json({
                message: "Kundvagnen är tom",
                cart: []
            });
        }

        // Lägg till cartData i request objektet för att användas i nästa middleware
        req.cartData = cartData;

        // Fortsätt till nästa middleware (checkInventory)
        next();

    } catch (error) { // Om något annat går fel...
        console.error(`Misslyckades med att hämta kundvagnsdata för användare ${user_id}`, error);
        return res.status(500).json({
            error: "Oväntat fel",
            message: "Ett oväntat fel inträffade vid hämtning av kundvagnsdata"
        });
    }
};

module.exports = getCartData;