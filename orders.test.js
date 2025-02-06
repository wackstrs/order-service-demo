const request = require("supertest");
const express = require("express");
const nock = require("nock");
const router = require("./routes/orders"); // Path to your routes file

const app = express();
app.use(express.json());
app.use(router); // Assuming your routes are in `routes/orders.js`

describe("POST /orders", () => {
  beforeAll(() => {
    // Mock cart-service response
    nock("https://cart-service-git-cart-service.2.rahtiapp.fi")
      .get("/cart/1")
      .reply(200, {
        cart: [
          { product_id: 1, quantity: 2, price: 10, product_name: "Beer A", total_price: 20 },
          { product_id: 2, quantity: 1, price: 15, product_name: "Beer B", total_price: 15 }
        ]
      });

    // Mock inventory-service response
    nock("https://dev-inventory-service-inventory-service.2.rahtiapp.fi")
      .post("/inventory/decrease")
      .reply(200, { message: "Inventory updated successfully" });
  });

  afterAll(() => {
    nock.cleanAll();
  });

  it("should create an order with hardcoded data", async () => {
    const res = await request(app)
      .post("/orders")
      .send({
        userId: 1,
        token: "fake-jwt-token"
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Order skapad");
    expect(res.body.order).toHaveProperty("orderPrice", 35); // Check if the total price is correct
  });
});
