const INVOICING_SERVICE_URL = process.env.INVOICING_SERVICE_URL;

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
                product_id: Number(item.product_id), // BORDE VARA STRING! Men invoicing APIn kräver atm en INT
                amount: item.quantity,
                product_price: item.product_price,
                product_name: item.product_name
            }))
        };

        console.log('newOrder: ', newOrder);
        console.log('shipmentData: ', shipmentData)

        // Send to invoicing
        const resInvoice = await fetch(INVOICING_SERVICE_URL, {
            method: 'POST', // We're sending data to the server
            headers: {
                // Tells the server that we are sending JSON
                'Content-Type': 'application/json'
            },
            // Convert the data object into JSON
            body: JSON.stringify(shipmentData)
        });
        console.log("resInvoice: ", resInvoice);

        // Check if the INVOICE is OK (status code 200-299)
        if (!resInvoice.ok) {
            console.error('Failed to send order data');
            return null;
        }

        // Send to email
        // Sending the POST request using async/await
        /* const resEmail = await fetch(INVOICING_SERVICE_URL, {
            method: 'POST', // We're sending data to the server
            headers: {
                // Tells the server that we are sending JSON
                'Content-Type': 'application/json'
            },
            // Convert the data object into JSON
            body: JSON.stringify(data)
        }); */

        // Check if the EMAIL is OK (status code 200-299)
        /* if (!resEmail.ok) {
            console.error('Failed to send order data');
            return null;
        } */

        // If successful, parse the response as JSON
        const responseDataInvoice = await resInvoice.json();
        console.log("responseDataInvoice: ", responseDataInvoice);
        /*         const responseDataEmail = await resEmail.json();
         */
        // Return the server's responses
        return { responseDataInvoice/* , responseDataEmail */ };

    } catch (error) {
        console.error('Error sending order data:', error);
        return null;
    }
}

module.exports = sendOrder;