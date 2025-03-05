const INVOICING_SERVICE_URL = process.env.INVOICING_SERVICE_URL;
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;

// invoicingAPI POST med information om user_id och dens beställning

// Skicka ordern till fakturering / invoicing
// Information om beställningen kommer från getCartData funktion
// dens return kan användas i /orders POST i orderRoutes för att köra sendOrder
async function sendOrder(newOrder, token) {
    const { user_id, order_price, order_id, order_items, timestamp, shipping_address } = newOrder;

    // Invoice payload
    const invoiceData = {
        user_id,
        timestamp,
        order_price,
        order_id,
        shipping_address,
        order_items: order_items.map(item => ({
            order_item_id: item.order_item_id,
            product_id: item.product_id,
            amount: item.quantity,
            product_price: item.product_price,
            product_name: item.product_name,
        })),
    }

    // Email payload
    const emailData = {
        subject: `Beercraft Order Confirmation #${order_id}`,
        body: [
            {
                orderId: order_id,
                userId: user_id,
                timestamp,
                orderPrice: order_price,
                shipping_address,
                orderItems: order_items.map(item => ({
                    product_image: item.product_image,
                    product_name: item.product_name,
                    product_description: item.product_description,
                    product_country: item.product_country,
                    product_category: item.product_category,
                    order_item_id: item.order_item_id,
                    order_id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    product_price: item.product_price,
                    total_price: item.total_price,
                })),
            },
        ],
    }

    console.log("Invoicing Data:", JSON.stringify(invoiceData, null, 2));
    console.log("Email Data:", JSON.stringify(emailData, null, 2));
    console.log("Token:", token);

    // Kör båda requests parallellt
    const [invoiceResult, emailResult] = await Promise.allSettled([
        // Invoicing request with /orders endpoint
        fetch(`${INVOICING_SERVICE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(invoiceData),
        }).then(res => res.ok ? res.json() : Promise.reject(`Invoice API status: ${res.status} - ${res.statusText}`)),

        // Email request with /order endpoint
        fetch(`${EMAIL_SERVICE_URL}/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(emailData),
        }).then(res => res.ok ? res.json() : Promise.reject(`Email API status: ${res.status} - ${res.statusText}`)),
    ]);

    // Checkar om promisen returnerar 'fulfilled'
    const invoiceStatus = invoiceResult.status === "fulfilled" ? "success" : "failed";

    // Ternary conditional operator -> const A = B === "fulfilled" ? (C ? D : F) : E;
    // Checkar om invoiceResult.status === "fulfilled" (B === "fulfilled")
    // TRUE -> Checkar om invoiceResult.value är error. (C)
    //      Yes -> använd invoiceResult.value.error.message (D)
    //      No  -> använd "Order data sent to invoicing-service successfully." (F)
    // FALSE -> använd invoiceResult.reason (E)
    const invoiceMessage = invoiceResult.status === "fulfilled"
        ? (invoiceResult.value.error ? invoiceResult.value.error.message : "Order data sent to invoicing-service successfully.")
        : invoiceResult.reason;

    // Gör samma med emailStatus
    const emailStatus = emailResult.status === "fulfilled" ? "success" : "failed";
    const emailMessage = emailResult.status === "fulfilled"
        ? (emailResult.value.error ? emailResult.value.error.message : "Order data sent to email-service successfully.")
        : emailResult.reason;

    // Returnerar status för email och invoice
    return {
        invoiceStatus,
        invoiceMessage,
        emailStatus,
        emailMessage,
    };
}

module.exports = sendOrder;