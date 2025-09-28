# Use the official Node.js image as base
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files from the root
COPY ./package*.json ./

# Install dependencies
# Using `npm ci` for reproducible builds
RUN npm ci --only=production

# Copy the rest of the application source code from the root
COPY . .

# Build the application
# The `build` script is defined in package.json
RUN npm run build

# Use nginx to serve the static files
FROM nginx:alpine

# Copy the built app to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 8080 (required for Cloud Run)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]