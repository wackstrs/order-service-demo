const INVOICING_SERVICE_URL = `${process.env.INVOICING_SERVICE_URL}/orders`;
const EMAIL_SERVICE_URL = `${process.env.EMAIL_SERVICE_URL}/order`;

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
                order_id: order_id,
                product_id: Number(item.product_id),
                amount: item.quantity,
                product_price: item.product_price,
                product_name: item.product_name,
                total_price: item.total_price,
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
            to: "test@email.com",
            subject: "Order Confirmation",
            body: [shipmentData],
        };

        console.log('Sending email with payload:', JSON.stringify(emailPayload, null, 2));
        console.log('Email service URL:', EMAIL_SERVICE_URL);

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
        } else {
            const emailErrorData = await resEmail.json();
            console.error('Email sending failed:', emailErrorData);
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
