const INVOICING_SERVICE_URL = process.env.INVOICING_SERVICE_URL;
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;

// invoicingAPI POST with order information
async function sendOrder(newOrder) {
    const { user_id, order_price, order_id, order_items, timestamp, email } = newOrder; // Ensure email is provided

    try {
        const shipmentData = {
            user_id,
            timestamp,
            order_price,
            order_id,
            order_items: order_items.map(item => ({
                order_item_id: item.order_item_id,
                product_id: Number(item.product_id), // Should be a string but the invoicing API requires an int for now
                amount: item.quantity,
                product_price: item.product_price,
                product_name: item.product_name,
            })),
        };

        console.log('newOrder: ', newOrder);
        console.log('shipmentData: ', shipmentData);

        // Send to invoicing service
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

        // Construct the email payload as required by your email-service API
        const emailPayload = {
            to: email, // Ensure email is passed through the request
            subject: 'Your Order Confirmation',
            body: [{
                orderId: String(order_id), // Make sure order_id is a string
                userId: String(user_id),   // Ensure user_id is a string
                timestamp: timestamp,      // Keep the timestamp as is
                orderPrice: parseFloat(order_price), // Ensure order_price is a number
                orderItems: order_items.map(item => ({
                    order_item_id: item.order_item_id,
                    order_id: String(item.order_id), // Ensure order_id is a string
                    product_id: String(item.product_id), // Ensure product_id is a string
                    product_name: item.product_name,
                    amount: item.quantity,
                    product_price: parseFloat(item.product_price), // Ensure product_price is a number
                    total_price: parseFloat(item.total_price) // Ensure total_price is a number
                }))
            }]
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
        } else {
            const errorResponse = await resEmail.text(); // Capture any error message from the email service
            console.log('Error response from Email Service:', errorResponse);
            emailStatus = "failed";
            emailMessage = "Failed to send order data to email.";
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