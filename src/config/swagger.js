const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Order Service API',
            version: '1.0.0',
            description: 'API documentation for the Order Service of the webshop Beer Craft',
        },
        servers: [
            {
                url: "https://order-service-demo-git-order-service-demo.2.rahtiapp.fi/api",
            },
            {
                url: "http://localhost:8080/api",
            },
        ],
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
    app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
};

module.exports = setupSwagger;
