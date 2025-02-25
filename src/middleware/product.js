const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

const getProductData = async (req, res, next) => {
    const cartData = req.cartData;
    const token = req.token; // Ensure token is used
    console.log("Using token:", req.token);


    try {
        // Function to get product details
        const getProductDetails = async (item) => {
            try {
                // Fetch product data from the service
                const response = await fetch(`${PRODUCT_SERVICE_URL}/products/${item.product_id}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch product data, status: ${response.status}`);
                }

                const data = await response.json();

                if (!data || !data.product || data.product.price == null) {
                    throw new Error(`Missing product data or price for ${item.product_id}`);
                }

                // Calculate total price for each item
                const product_price = data.product.price;
                const total_price = product_price * item.quantity;

                // Attach product details to each item
                return {
                    ...item,
                    product_price,
                    total_price,
                    product_description: data.product?.description || 'Ingen beskrivning tillgänglig',
                    product_image: data.product?.image || '/default-image.jpg',
                    product_country: data.product?.country || 'Okänt land',
                    product_category: data.product?.category || 'Okategoriserad'
                };

            } catch (err) {
                throw new Error(`Failed to fetch product data for ${item.product_id}: ${err.message}`);
            }
        };

        // Fetch and update product data for all cart items
        req.cartData.cart = await Promise.all(cartData.cart.map(getProductDetails));

        // Proceed to the next middleware
        next();
    } catch (error) {
        console.error("Error fetching product data:", error.message);
        
        // Send an error response instead of continuing
        return res.status(500).json({
            error: "Product data fetch failed",
            message: error.message
        });
    }
};

module.exports = getProductData;
