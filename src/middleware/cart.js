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
export async function getCartData(userId, token) { // userId och token kommer från JWT via front-end till vår /orders POST
    try {
        const response = await fetch(`https://cart-service-git-cart-service.2.rahtiapp.fi/cart/${userId}`, {
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

        // Returnerar cartData i JSON format
        return cartData;
    } catch (error) { // Om någonting misslyckas, returnera null
        console.error('Error creating order:', error);
        return null;
    }
}