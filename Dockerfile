# Dockerfile
FROM node:18

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose port (update if your app uses a different port)
EXPOSE 3000

# Start the app
CMD ["node", "src/app.js"]
