# Use the official Node.js image as base
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Full install, not --only=production: the build stage needs vite,
# typescript, and @vitejs/plugin-react, which are devDependencies. None of
# this node_modules ships in the final image below (multi-stage build).
RUN npm ci

# Copy source code
COPY . .

# Vite substitutes import.meta.env.VITE_* into the bundle at BUILD time, not
# when the container runs — `gcloud run deploy --set-env-vars` only sets the
# nginx process's runtime environment, which a static SPA never reads. These
# must come in as build args: `docker build --build-arg VITE_SUPABASE_URL=...`
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GEMINI_API_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Build the application
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