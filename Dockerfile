# Sử dụng Node.js LTS
FROM node:20-alpine

# Set working dir trong container
WORKDIR /app

# Copy package trước (tận dụng cache)
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Expose port 3000 cho app
EXPOSE 3002

# Start app
CMD ["node", "src/index.js"]