const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

const getProductData = async (req, res, next) => {
    const cartData = req.cartData;
    const token = req.token; // Use the token that was set by authMiddleware

    try {
        console.log("Fetching product data for cart items...");
        // Hämtar alla product_id från användarens cart
        const productCodes = cartData.cart.map(item => item.product_id);

        // Request body som innehåller alla product_id
        const requestBody = {
            product_codes: productCodes
        };

        // Skickar en POST request som returnerar information om alla våra product_id i cartData
        const response = await fetch(`${PRODUCT_SERVICE_URL}/products/batch`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch product data, status: ${response.status}`);
        }

        // Parse JSON respons
        const data = await response.json();

        // Mappar cartData innehållet och matchar det med produkinformationen (rätt product_id får rätt information)
        const updatedCartData = cartData.cart.map(item => {
            // Hittar productinformationen som matchar product_idn
            const productData = data.products.find(product => product.sku === item.product_id);

            // Om vi hittar information om produkten, räkna ut pris och returnera den uppdaterade informationen
            if (productData) {
                const product_price = parseFloat(productData.price || 0); // Checkar att det är en siffra
                const total_price = product_price * item.quantity;

                // Sätter in information som hör till varje product_id. Default värden om information inte hittas
                return {
                    ...item,
                    product_price,
                    total_price,
                    product_name: productData.name || "Okänd produkt", 
                    product_description: productData.description || "Ingen beskrivning tillgänglig",
                    product_image: productData.image || "/default-image.jpg",
                    product_country: productData.country || "Okänt land", 
                    product_category: productData.category || "Okategoriserad" 
                };
            } else {
                // Om vi inte hittar produktinformation, returnera produkten med default information
                return {
                    ...item,
                    product_price: 0,
                    total_price: 0,
                    product_name: "Okänd produkt",
                    product_description: "Ingen beskrivning tillgänglig",
                    product_image: "/default-image.jpg",
                    product_country: "Okänt land",
                    product_category: "Okategoriserad"
                };
            }
        });

        // Uppdatera cartData med produktinformation
        req.cartData.cart = updatedCartData;
        console.log("Product Data Fetch - OK");

        // fortsätt till nästa middleware
        next();
    } catch (error) {
        console.error("Error fetching product data:", error.message);
        return res.status(500).json({
            error: "Product data fetch failed",
            message: error.message
        });
    }
};

module.exports = getProductData;