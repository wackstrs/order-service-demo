const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

// Middleware för att hämta produktdata baserat på kundvagnens innehåll
const getProductData = async (req, res, next) => {
    const cartData = req.cartData; // Hämta kundvagnsdata från föregående middleware
    const token = req.token;

    try {
        console.log("Fetching product data for cart items...");

        // Extrahera alla produkt-ID från användarens kundvagn
        const productCodes = cartData.cart.map(item => item.product_id);

        // Skapa request-body med alla produkt-ID
        const requestBody = {
            product_codes: productCodes
        };

        // Skicka en POST-förfrågan till produktservicen för att hämta produktinformation
        const response = await fetch(`${PRODUCT_SERVICE_URL}/products/batch`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`, // Använd JWT-token för autentisering
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        // Kontrollera om förfrågan lyckades
        if (!response.ok) {
            throw new Error(`Failed to fetch product data, status: ${response.status}`);
        }

        // Parsa JSON-svar
        const data = await response.json();

        // Uppdatera kundvagnsdata genom att koppla varje vara med dess produktinformation
        const updatedCartData = cartData.cart.map(item => {
            // Hitta motsvarande produktinformation baserat på product_id
            const productData = data.products.find(product => product.sku === item.product_id);

             // Om produktinformationen finns, räkna ut pris och returnera uppdaterad information
            if (productData) {
                const product_price = parseFloat(productData.price || 0); // Säkerställ att priset är en siffra
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
                // Om produktinformationen saknas, sätt default-värden
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

        // Uppdatera kundvagnsdata med produktinformation
        req.cartData.cart = updatedCartData;
        console.log("Product Data Fetch - OK");

        // Fortsätt till nästa middleware
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