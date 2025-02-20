const INVOICING_SERVICE_URL = process.env.INVOICING_SERVICE_URL;
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;

// invoicingAPI POST med information om user_id och dens beställning

// Skicka ordern till fakturering / invoicing
// Information om beställningen kommer från getCartData funktion
// dens return kan användas i /orders POST i orderRoutes för att köra sendOrder
async function sendOrder(newOrder) {
    const { user_id, order_price, order_id, order_items, timestamp } = newOrder;

    try {
        const shipmentData = {
            user_id,
            timestamp,
            order_price,
            order_id,
            order_items: order_items.map(item => ({
                order_item_id: item.order_item_id,
                order_id: order_id, // <-- You need to include this in email payload
                product_id: Number(item.product_id), // Still converting to number for invoicing
                amount: item.quantity,
                product_price: item.product_price,
                product_name: item.product_name,
                total_price: item.total_price // <-- This is required in email payload
            })),
        };

        // --- INVOICING ---
        const resInvoice = await fetch(INVOICING_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shipmentData)
        });

        let invoiceStatus = "failed";
        let invoiceMessage = "Failed to send order data to invoicing.";

        if (resInvoice.ok) {
            invoiceStatus = "success";
            invoiceMessage = "Order data sent to invoicing successfully.";
        }

        // --- EMAIL ---
        const emailPayload = {
            to: "test@email.com", // You can replace this dynamically later if needed
            subject: "Order Confirmation",
            body: [shipmentData], // Email service expects this inside an array
        };

        const resEmail = await fetch(EMAIL_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload)
        });

        let emailStatus = "failed";
        let emailMessage = "Failed to send order confirmation email.";

        if (resEmail.ok) {
            emailStatus = "success";
            emailMessage = "Order confirmation email sent successfully.";
        }

        // --- RETURN STATUS ---
        return {
            invoiceStatus,
            invoiceMessage,
            emailStatus,
            emailMessage,
        };

    } catch (error) {
        console.error('Error sending order data:', error);
        return {
            invoiceStatus: "failed",
            invoiceMessage: error.message,
            emailStatus: "failed",
            emailMessage: "Error occurred while sending the email data."
        };
    }
}

module.exports = sendOrder;
