# Compliance API Docker Image
# Builds from the distribution package zip file
# Usage: docker build -t compliance-api:2.0.0 .
#        docker run -p 3001:3001 --env-file .env compliance-api:2.0.0

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy the distribution package (tar.gz preferred, zip as fallback)
# The build-distribution.js creates both formats
COPY dist/ ./dist/

# Extract the distribution package
RUN if [ -f dist/compliance-api-*.tar.gz ]; then \
      echo "Extracting tar.gz..." && \
      tar -xzf dist/compliance-api-*.tar.gz && \
      rm -rf dist/; \
    elif [ -f dist/compliance-api-*.zip ]; then \
      echo "Extracting zip..." && \
      apk add --no-cache unzip && \
      unzip -o "dist/compliance-api-"*.zip && \
      rm -rf dist/; \
    else \
      echo "ERROR: No distribution package found!" && exit 1; \
    fi && \
    echo "Contents after extraction:" && ls -la

# Move files from the extracted folder to the app root if needed
RUN if [ -d compliance-api-* ]; then \
      echo "Moving files from extracted directory..." && \
      cd compliance-api-* && \
      mv * /app/ && \
      cd /app && \
      rm -rf compliance-api-* && \
      echo "Files moved to /app"; \
    else \
      echo "Files already in place"; \
    fi && \
    echo "Final structure:" && ls -la /app

# Install production dependencies only
RUN npm install --production --omit=dev

# Stage 2: Runtime stage
FROM node:18-alpine

LABEL maintainer="Compliance API"
LABEL description="Compliance Management API - Production Ready"
LABEL version="2.0.0"

WORKDIR /app

# Copy only production dependencies and source from builder
COPY --from=builder /app /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose the API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["npm", "run", "start"]
