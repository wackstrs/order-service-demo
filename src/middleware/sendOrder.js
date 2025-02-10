const INVOICING_SERVICE_URL = process.env.INVOICING_SERVICE_URL;

async function sendOrder(newOrder) {
    const { user_id, order_price, order_id, order_items, timestamp } = newOrder;

    try {
        // Format the shipment data for the entire order
        const shipmentData = {
            user_id,
            timestamp,              
            order_price,
            order_id,
            order_items: order_items.map(item => ({
                order_item_id: item.order_item_id,
                product_id: item.product_id,
                amount: item.quantity,    
                product_price: item.product_price,
                product_name: item.product_name
            }))
        };


        console.log("Sending to invoicing-service:", JSON.stringify(shipmentData, null, 2));

        // Send to invoicing-service
        const resInvoice = await fetch(INVOICING_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shipmentData),
        });

        if (!resInvoice.ok) {
            const errorResponse = await resInvoice.text();
            console.error(`Failed to send order data: ${resInvoice.status} - ${errorResponse}`);
            return { error: `Failed to send order: ${errorResponse}` };
        }

        const responseDataInvoice = await resInvoice.json();
        console.log("Invoicing response:", responseDataInvoice);

        return { success: true, responseDataInvoice };

    } catch (error) {
        console.error("Error sending order data:", error);
        return { success: false, error: error.message };
    }
}

module.exports = sendOrder;