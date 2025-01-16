# Use the official Node.js image from the Docker Hub as the base image
FROM node:22

# Create and change to the app directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
COPY prisma ./prisma/

# Install the app dependencies
RUN npm install
RUN npm install -g @prisma/client

# Copy the rest of the application code to the working directory
COPY . .

# Run as user node (not root)
RUN chown -R node:node /app
RUN chmod -R 777 /app/node_modules/.prisma/client
USER node

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the app
CMD ["sh", "-c", "if [ \"$MODE\" = 'development' ]; then npm run dev; else npm start; fi"]
