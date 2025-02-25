const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;
const fetchProductData = async (req, res, next) => {
    const cartData = req.cartData;

    try {
        // Fetch product details for each item in the cart
        const productDataPromises = cartData.cart.map(item => 
            fetch(`${PRODUCT_SERVICE_URL}/product/${item.product_id}`)
                .then(response => response.json())
                .then(data => {
                    // Attach product data to the cart item
                    item.product_description = data.product?.description || 'No description available';  // Fallback for description
                    item.product_image = data.product?.image || '/default-image.jpg';  // Fallback for image
                    item.product_country = data.product?.country || 'Unknown';  // Fallback for country
                    item.product_category = data.product?.category || 'Uncategorized';  // Fallback for category
                })
                .catch(err => {
                    console.error(`Failed to fetch product data for ${item.product_id}`, err);
                    // Use fallback data if the fetch fails
                    item.product_description = 'No description available';
                    item.product_image = '/default-image.jpg';  // Fallback image
                    item.product_country = 'Unknown';
                    item.product_category = 'Uncategorized';
                })
        );

        // Wait for all product data fetches to complete
        await Promise.all(productDataPromises);
        
        // Continue to the next middleware
        next();

    } catch (error) {
        console.error("Error in fetching product data:", error);
        // Continue the process even if fetching product data fails
        next();
    }
};

// Export middleware for use in routes
module.exports = fetchProductData;