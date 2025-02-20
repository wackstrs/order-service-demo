# Use the official slim Node.js image from the Docker Hub as the base image
FROM node:22-slim

# Create and change to the app directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory first (for caching)
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Copy only the prisma folder (this step will be cached unless prisma changes)
COPY prisma ./prisma/

# Install Prisma client globally
RUN npm install -g @prisma/client

# Now copy the rest of the application code (this step happens after dependencies are installed)
COPY . .

# Run as user node (not root)
RUN chown -R node:node /app
RUN chmod -R 777 /app/node_modules/.prisma/client
USER node

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the app
CMD ["sh", "-c", "if [ \"$MODE\" = 'development' ]; then npm run dev; else npm start; fi"]
