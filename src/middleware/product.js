const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

const getProductData = async (req, res, next) => {
    const cartData = req.cartData;
    const token = process.env.PRODUCT_SERVICE_AUTH_TOKEN || req.token;

    if (!token) {
        return res.status(500).json({
            error: "Missing authentication token",
            message: "Product service requires an authentication token"
        });
    }

    try {
        const productIds = cartData.cart.map(item => item.product_id); // Collect product IDs
        const response = await fetch(`${PRODUCT_SERVICE_URL}/products`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ product_ids: productIds }) // Send all IDs in a single request
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const data = await response.json();

        // Now match products to cart items
        const updatedCartData = cartData.cart.map(item => {
            const product = data.products.find(p => p.id === item.product_id);
            return {
                ...item,
                product_price: product.price,
                total_price: product.price * item.quantity,
                product_name: product.name,
                product_description: product.description,
                product_image: product.image,
                product_country: product.country,
                product_category: product.category
            };
        });

        req.cartData.cart = updatedCartData;
        next();
    } catch (error) {
        console.error("Error fetching product data:", error);
        return res.status(500).json({
            error: "Failed to fetch product data",
            message: error.message
        });
    }
};
