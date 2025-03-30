FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files for dependency installation
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code and tsconfig
COPY . .

# Build the TypeScript project
RUN npm run build && chmod 755 build/index.js

# Expose port for HTTP transport (if needed in future)
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production

# Run the server
CMD ["node", "build/index.js"]
