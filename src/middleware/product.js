const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

const getProductData = async (req, res, next) => {
    const cartData = req.cartData;

    try {
        // Function to get product details
        const getProductDetails = async (item) => {
            try {
                // Fetch product data from the service
                const response = await fetch(`${PRODUCT_SERVICE_URL}/product/${item.product_id}`);

                // Check if the response is ok (status code 200-299)
                if (!response.ok) {
                    throw new Error(`Failed to fetch, status: ${response.status}`);
                }

                const data = await response.json();

                // Check if product data exists in the response
                if (!data || !data.product) {
                    throw new Error('No product data found');
                }

                // Attach product details to each item
                return {
                    ...item,
                    product_description: data.product?.description || 'Ingen beskrivning tillgänglig',
                    product_image: data.product?.image || '/default-image.jpg',
                    product_country: data.product?.country || 'Okänt land',
                    product_category: data.product?.category || 'Okategoriserad'
                };

            } catch (err) {
                console.error(`Failed to fetch product data for ${item.product_id}:`, err.message);
                // Return item with default values if there's an error
                return {
                    ...item,
                    product_description: 'Ingen beskrivning tillgänglig',
                    product_image: '/default-image.jpg',
                    product_country: 'Okänt land',
                    product_category: 'Okategoriserad'
                };
            }
        };


        // Hämta och uppdatera produktdata för alla produkter
        const updatedCartData = await Promise.all(cartData.cart.map(getProductDetails));

        // Uppdatera cartData med produktinformation
        req.cartData.cart = updatedCartData;

        // fortsätt till nästa middleware
        next();
    } catch (error) {
        console.error("Error in fetching product data:", error);
        next(); // fortsätt till nästa middleware fast det inte gick att hämta produktdata
    }
};

module.exports = getProductData;
