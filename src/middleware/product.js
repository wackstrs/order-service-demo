const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

const getProductData = async (req, res, next) => {
    const cartData = req.cartData;

    try {
        // hämta produktinformation
        const getProductDetails = async (item) => {
            try {
                const response = await fetch(`${PRODUCT_SERVICE_URL}/product/${item.product_id}`);
                const data = await response.json();

                // lägg till produktinformation till varje item (produkt), använd default-värden om information saknas
                return {
                    ...item,
                    product_description: data.product?.description || 'Ingen beskrivning tillgänglig',
                    product_image: data.product?.image || '/default-image.jpg',
                    product_country: data.product?.country || 'Okänt land',
                    product_category: data.product?.category || 'Okategoriserad'
                };
            } catch (err) {
                console.error(`Failed to fetch product data for ${item.product_id}`, err);
                // använd default-värden om det inte går att hämta produktinfon
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
