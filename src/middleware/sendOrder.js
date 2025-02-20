const INVOICING_SERVICE_URL = `${process.env.INVOICING_SERVICE_URL}/orders`;
const EMAIL_SERVICE_URL = `${process.env.EMAIL_SERVICE_URL}/order`;

async function sendOrder(newOrder) {
    const { user_id, order_price, order_id, order_items, timestamp } = newOrder;

    try {
        // --- INVOICING PAYLOAD ---
        const invoicingPayload = {
            user_id,
            timestamp,
            order_price,
            order_id,
            order_items: order_items.map(item => ({
                order_item_id: item.order_item_id,
                order_id,
                product_id: Number(item.product_id),
                amount: item.quantity,
                product_price: item.product_price,
            })),
        };

        console.log("Sending payload to INVOICING service:", JSON.stringify(invoicingPayload, null, 2));

        const resInvoice = await fetch(INVOICING_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoicingPayload),
        });

        let invoiceStatus = resInvoice.ok ? "success" : "failed";
        let invoiceMessage = resInvoice.ok
            ? "Order data sent to invoicing successfully."
            : `Failed to send order data to invoicing. Status: ${resInvoice.status}`;

        if (!resInvoice.ok) {
            const invoiceErrorData = await resInvoice.text();
            console.error('INVOICING service response:', invoiceErrorData);
        }

        // --- EMAIL PAYLOAD ---
        const emailPayload = {
            to: "test@email.com", // Optional: Replace with user's email if available in `newOrder`
            subject: "Tilausvahvistus", // This is the Finnish word for "Order Confirmation"
            body: [
                {
                    orderId: order_id,
                    userId: user_id,
                    timestamp: timestamp,
                    orderPrice: order_price,
                    orderItems: order_items.map(item => ({
                        order_item_id: item.order_item_id,
                        order_id: order_id,
                        product_id: item.product_id,
                        product_name: item.product_name,
                        amount: item.quantity,
                        product_price: item.product_price,
                        total_price: item.total_price,
                    })),
                },
            ],
        };

        console.log("Sending payload to EMAIL service:", JSON.stringify(emailPayload, null, 2));

        const resEmail = await fetch(EMAIL_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
        });

        let emailStatus = resEmail.ok ? "success" : "failed";
        let emailMessage = resEmail.ok
            ? "Order confirmation email sent successfully."
            : `Failed to send order confirmation email. Status: ${resEmail.status}`;

        if (!resEmail.ok) {
            const emailErrorData = await resEmail.text();
            console.error('EMAIL service response:', emailErrorData);
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
            emailMessage: "Error occurred while sending the email data.",
        };
    }
}

module.exports = sendOrder;
