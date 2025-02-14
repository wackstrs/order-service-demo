# order-service

## What this service does
- När en user klickar "beställ" på Store frontend, skickar Store en POST till Orders
- En ny Order skapas i vår databas med en success response
- Själva Order:n hämtas från Cart, till vilken vi skickar en GET request
- Order produkternas pris fås även från cart
- Möjligen skickas en GET request till Products för att hämta information om produkterna
- Produkt mängden i Inventory uppdateras på det sätt de bestämmer
- En POST skickas också till Email och Invoicing för att skicka till användaren, när en Order skapats

## How to use
1. Clone the project git clone https://github.com/CNA-25/order-service.git
2. Make sure Node.js is installed with npm -v, if not, install it
3. Install dependencies with npm install

## Endpoint guide
### GET /orders/:user_id

### Denna endpoint hämtar alla ordrar för en specifik användare, inklusive orderdetaljer

### Parametrar
| Parameter | Typ | Beskrivning       | 
| --------- | --- | ----------------- |
| user_id   | int | Unikt användar-ID |

### Svar
| Statuskod                 | Beskrivning                                            | 
| ------------------------- | ------------------------------------------------------ |
| 200 OK                    | Returnerar en lista med ordrar inklusive orderdetaljer |
| 404 Not Found             | Om inga ordrar hittas för användaren                   |
| 500 Internal Server Error | Om ett serverfel uppstår                               |


### POST /orders

### Denna endpoint skapar en ny order baserat på användarens kundvagn

### Request Body
| Parameter | Typ    | Beskrivning       | 
| --------- | ------ | ----------------- |
| user_id    | int    | Unikt användar-ID |
| token     | string | JWT-token         |

### Svar
| Statuskod                 | Beskrivning                                        | 
| ------------------------- | -------------------------------------------------- |
| 201 Created               | Ordern har skapats och returneras i svaret         |
| 400 Bad Request           | Om userId, token saknas eller om kundvagnen är tom |
| 500 Internal Server Error | Om ett serverfel uppstår                           |

## To-do lista:
Order Service

1.	Hämta beställningar från vår DB som hör till en viss user_id
GET -> user_id, lista med information om beställningen (order_items, products)
Respons = data eller not found

2.	Skapa beställning för en viss userId med de produkter som finns i dens köpkorg och spara i vår DB
POST -> user_id, lista med information om produkter (product_id)
Respons = success eller fail

3.	/cartAPI
GET information om produkterna i userId köpkorg

4.	/emailAPI
POST? information om userId med dens beställning -> skickar ett email

5.	/invoicingAPI
POST? information om userId med dens beställning -> skapar en faktura

6.	/productsAPI
GET information om produkterna ur produktregistret (ännu oklart om detta behövs)

7.	/inventoryAPI
POST att minska productId saldo från lagret

+ error handling

## Databas

Orders table:
- order_id - SERIAL & auto-increment, primary key
- user_id - INTEGER - den inloggades användarens unika id
- timestamp - TIMESTAMP - när beställningen gjordes
- order_price - NUMERIC - totala priset för hela beställningen (quantity * product_price)

Order_items table:
- order_item_id - INTEGER
- order_id - INTEGER - foreign key som är kopplad till Orders.order_id
- product_id - VARCHAR (123-ABC) - produktens id, kommer från cartAPI?
- quantity - INTEGER - antal produkter, kommer från cartAPI?
- product_price - NUMERIC - produktens pris, kommer från cartAPI?
- product_name - STRING - produktens namn, kommer från cartAPI?
