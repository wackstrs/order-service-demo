const INVOICING_SERVICE_URL = `${process.env.INVOICING_SERVICE_URL}/orders`;
const EMAIL_SERVICE_URL = `${process.env.EMAIL_SERVICE_URL}/order`;

// Function to send the order data to invoicing and email services
async function sendOrder(newOrder, user_email) {
    const { user_id, order_price, order_id, order_items, timestamp } = newOrder;

    try {
        // --- Validate Invoicing Payload ---
        if (!user_id || !order_id || !order_items || order_items.length === 0) {
            throw new Error("Invalid order data. Missing required fields: user_id, order_id, or order_items.");
        }

        // Validate each item in the order
        order_items.forEach(item => {
            if (!item.order_item_id || !item.product_id || !item.product_name || !item.quantity || !item.product_price) {
                throw new Error(`Invalid item data. Missing required fields in item with product_id: ${item.product_id}`);
            }
        });

        // Prepare the invoicing data
        const invoiceData = {
            user_id,
            timestamp,
            order_price,
            order_id,
            order_items: order_items.map(item => ({
                order_item_id: item.order_item_id,
                product_id: item.product_id, // Ensure it's an INT as per invoicing API requirement
                amount: item.quantity,
                product_price: item.product_price,
                product_name: item.product_name,
            })),
        };

        // Log the invoicing payload
        console.log("Invoicing Payload:", JSON.stringify(invoiceData, null, 2));

        // Send the order data to invoicing service
        const resInvoice = await fetch(INVOICING_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData),
        });

        let invoiceStatus = "failed";
        let invoiceMessage = "Failed to send order data to invoicing.";

        if (resInvoice.ok) {
            const invoiceResponse = await resInvoice.json();
            // Check if the response contains specific error details if not OK
            if (invoiceResponse.error) {
                invoiceMessage = invoiceResponse.error.message || invoiceMessage;
            } else {
                invoiceStatus = "success";
                invoiceMessage = "Order data sent to invoicing successfully.";
            }
        } else {
            invoiceMessage = `Invoice API returned status: ${resInvoice.status}`;
        }

        // Log the status of invoicing
        console.log("Invoicing Response Status:", invoiceStatus);
        console.log("Invoicing Response Message:", invoiceMessage);

        // --- Prepare the email data ---
        const emailData = {
            to: user_email,
            subject: "Beställningsbekräftelse",
            body: [
                {
                    orderId: order_id,
                    userId: user_id,
                    timestamp,
                    orderPrice: order_price,
                    orderItems: order_items.map(item => ({
                        order_item_id: item.order_item_id,
                        order_id,
                        product_id: item.product_id,
                        product_name: item.product_name,
                        amount: item.quantity,
                        product_price: item.product_price,
                        total_price: item.total_price,
                    })),
                },
            ],
        };

        // Log the email payload
        console.log("Email Payload:", JSON.stringify(emailData, null, 2));

        // Send the order confirmation email
        const resEmail = await fetch(EMAIL_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData),
        });

        let emailStatus = "failed";
        let emailMessage = "Failed to send order data to email.";

        if (resEmail.ok) {
            const emailResponse = await resEmail.json();
            // Check if the response contains specific error details if not OK
            if (emailResponse.error) {
                emailMessage = emailResponse.error.message || emailMessage;
            } else {
                emailStatus = "success";
                emailMessage = "Order sent to email successfully.";
            }
        } else {
            emailMessage = `Email API returned status: ${resEmail.status}`;
        }

        // Log the status of email
        console.log("Email Response Status:", emailStatus);
        console.log("Email Response Message:", emailMessage);

        // Return the status of both the invoicing and email services
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
