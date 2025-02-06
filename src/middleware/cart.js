const getCartData = async (req, res, next) => {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({
      error: "Missing Fields",
      message: "userId and token are required",
    });
  }

  try {
    // Fetch user's cart data from cart-service
    const response = await fetch(`https://cart-service-git-cart-service.2.rahtiapp.fi/cart/${userId}`, {
      method: "GET",
      headers: {
        'token': token // Use the provided JWT token
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch cart data');
      return res.status(400).json({
        error: "Failed to fetch cart data",
        message: "The cart service request failed",
      });
    }

    // Parse the cart data
    const cartData = await response.json();

    // Validate the cart data
    if (!cartData || !cartData.cart || cartData.cart.length === 0) {
      console.error('Cart is empty or invalid');
      return res.status(400).json({
        error: "Empty or Invalid Cart",
        message: "The cart is empty or invalid",
      });
    }

    // Attach cart data to the request object
    req.cartData = cartData;

    // Proceed to the next middleware
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
