# Use the official Node.js image from the Docker Hub as the base image
FROM node:22

# Create and change to the app directory
WORKDIR /app

# Copy package.json, package-lock.json, and Prisma schema files to the working directory
COPY package*.json ./
COPY prisma ./prisma/

# Install the app dependencies and Prisma Client
RUN npm install && npm install -g @prisma/client

# Copy the rest of the application code to the working directory
COPY . .

# Run as user node (not root)
RUN chown -R node:node /app
USER node

# Expose the port the app runs on
EXPOSE 8080

# Define the command to handle Prisma migrations and run the app
CMD ["sh", "-c", "if [ \"$MODE\" = 'development' ]; then npx prisma migrate dev && npm run dev; else npx prisma migrate deploy && npm start; fi"]
