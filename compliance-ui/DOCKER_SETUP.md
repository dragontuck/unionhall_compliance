# Compliance UI Docker Setup

This Docker setup runs the Compliance React UI on port 5173 using Nginx as a web server.

## Files

- **Dockerfile** - Multi-stage build:
  - Stage 1 (builder): Builds the React app using Node.js 22
  - Stage 2 (production): Serves the built app with Nginx Alpine
  
- **docker-compose.yml** - Orchestrates the service with port mapping
  
- **nginx.conf** - Nginx configuration with:
  - SPA routing fallback to index.html
  - Gzip compression
  - Cache headers for static assets
  - Health check endpoint

## Quick Start

### Build and Run

```bash
# Build the image and start the container
docker-compose up -d

# View logs
docker-compose logs -f compliance-ui

# Stop the container
docker-compose down
```

### Rebuild

```bash
# Rebuild the image after code changes
docker-compose up -d --build
```

### Access

- **UI**: http://localhost:5173
- **Health Check**: http://localhost:5173/health

## Configuration

### Port
To change the port, modify `docker-compose.yml`:
```yaml
ports:
  - "YOUR_PORT:5173"
```

### Environment Variables
Add environment variables in `docker-compose.yml`:
```yaml
environment:
  - VARIABLE_NAME=value
```

## Production Considerations

- Use a .dockerignore file to exclude unnecessary files from the build
- Consider using a reverse proxy (nginx on the host) to handle SSL/TLS
- Implement proper logging and monitoring
- Tag images with version numbers
- Consider using a private registry for images
