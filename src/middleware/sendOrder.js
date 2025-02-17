const INVOICING_SERVICE_URL = process.env.INVOICING_SERVICE_URL;
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;

// invoicingAPI POST med information om user_id och dens beställning

// Skicka ordern till fakturering / invoicing
// Information om beställningen kommer från getCartData funktion
// dens return kan användas i /orders POST i orderRoutes för att köra sendOrder

async function sendOrder(newOrder) {
    const { user_id, order_price, order_id, order_items, timestamp, email } = newOrder; // Make sure email is provided

    try {
        const shipmentData = {
            user_id,
            timestamp,
            order_price,
            order_id,
            order_items: order_items.map(item => ({
                order_item_id: item.order_item_id,
                product_id: Number(item.product_id), // BORDE VARA STRING! Men invoicing APIn kräver atm en INT
                amount: item.quantity,
                product_price: item.product_price,
                product_name: item.product_name,
            })),
        };

        console.log('newOrder: ', newOrder);
        console.log('shipmentData: ', shipmentData);

        // Send to invoicing
        const resInvoice = await fetch(INVOICING_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shipmentData),
        });

        let invoiceStatus = "failed";
        let invoiceMessage = "Failed to send order data to invoicing.";

        if (resInvoice.ok) {
            const responseDataInvoice = await resInvoice.json();
            invoiceStatus = "success";
            invoiceMessage = "Order data sent to invoicing successfully.";
        }

        let emailStatus = "failed";
        let emailMessage = "Failed to send order data to email.";

        // Construct email payload as required by your email-service API
        const emailPayload = {
            to: email, // or req.userData.email if using JWT
            subject: 'Your Order Confirmation',
            body: [shipmentData], // Wrap in array as expected by email service
        };

        console.log('emailPayload: ', emailPayload);

        // Send to email service
        const resEmail = await fetch(EMAIL_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
        });

        if (resEmail.ok) {
            const responseDataEmail = await resEmail.json();
            emailStatus = "success";
            emailMessage = "Order sent to email successfully.";
        }

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
            emailMessage: "Error occurred while sending the email data.",
        };
    }
}


module.exports = sendOrder;