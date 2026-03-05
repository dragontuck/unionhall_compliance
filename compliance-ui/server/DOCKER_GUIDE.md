# Docker Setup Guide - Compliance API

## Overview

The Compliance API can be deployed as a Docker container using the distribution package. This guide covers building and running the containerized API.

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 1.29+)
- Distribution package built: `npm run build:dist`
- `.env` file configured with database credentials

## Quick Start

### 1. Build Distribution Package
```bash
npm run build:dist
# Creates: dist/compliance-api-2.0.0.zip
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your SQL Server settings
```

### 3. Build Docker Image
```bash
docker build -t compliance-api:2.0.0 .
```

### 4. Run Container
```bash
# Using Docker
docker run -p 3001:3001 --env-file .env compliance-api:2.0.0

# OR using Docker Compose
docker-compose up -d
```

### 5. Verify It's Running
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-02-06T...",
  "database": "connected"
}
```

---

## Dockerfile Details

### Multi-Stage Build
The Dockerfile uses a two-stage build process:

**Stage 1: Builder**
- Extracts the distribution ZIP file
- Installs dependencies
- Optimizes for production

**Stage 2: Runtime**
- Lightweight Alpine base image
- Runs non-root user (nodejs)
- Includes health checks
- ~100MB final image size

### Key Features
- ✅ Extracts distribution package automatically
- ✅ Multi-stage build for smaller image
- ✅ Non-root user for security
- ✅ Health checks included
- ✅ Production-optimized
- ✅ Alpine Linux (small, secure)

### Dockerfile Stages

```dockerfile
# Stage 1: Builder
FROM node:18-alpine as builder
- Copy distribution ZIP
- Extract and install dependencies

# Stage 2: Runtime
FROM node:18-alpine
- Copy built app from Stage 1
- Run as non-root user
- Health checks
- Start application
```

---

## Docker Compose

### Configuration
```yaml
services:
  compliance-api:
    build: .                    # Build from Dockerfile
    image: compliance-api:2.0.0 # Image name and version
    container_name: compliance-api
    ports:
      - "3001:3001"            # Port mapping
    env_file:
      - .env                    # Environment variables
    environment:
      - NODE_ENV=production     # Set production mode
    restart: unless-stopped     # Auto-restart
    healthcheck: {...}          # Health monitoring
```

### Usage
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f compliance-api

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---

## Environment Configuration

### .env File
Create a `.env` file with your database settings:

```env
PORT=3001
DB_SERVER=your-sql-server
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=UnionHall
NODE_ENV=production
```

### Pass to Container
```bash
# Using Docker
docker run --env-file .env -p 3001:3001 compliance-api:2.0.0

# Using Docker Compose
# Automatically reads .env file
docker-compose up -d
```

---

## Build Commands

### Build Image
```bash
# Build with default tag
docker build -t compliance-api:2.0.0 .

# Build with multiple tags
docker build -t compliance-api:2.0.0 -t compliance-api:latest .

# Build with build args
docker build --build-arg NODE_ENV=production -t compliance-api:2.0.0 .
```

### List Images
```bash
docker images | grep compliance-api
```

### Remove Image
```bash
docker rmi compliance-api:2.0.0
```

---

## Running Containers

### Basic Run
```bash
docker run -p 3001:3001 --env-file .env compliance-api:2.0.0
```

### With Named Volume
```bash
docker run -p 3001:3001 \
  --env-file .env \
  --name my-api \
  compliance-api:2.0.0
```

### Interactive Mode
```bash
docker run -it -p 3001:3001 \
  --env-file .env \
  compliance-api:2.0.0 \
  /bin/sh
```

### List Running Containers
```bash
docker ps
```

### View Container Logs
```bash
docker logs compliance-api
docker logs -f compliance-api  # Follow logs
```

### Stop Container
```bash
docker stop compliance-api
```

### Remove Container
```bash
docker rm compliance-api
```

---

## Docker Compose Commands

### Start Services
```bash
# Start in background
docker-compose up -d

# Start with logs displayed
docker-compose up

# Rebuild images and start
docker-compose up -d --build
```

### View Logs
```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Follow specific service
docker-compose logs -f compliance-api
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop without removing
docker-compose stop
```

### Restart Services
```bash
docker-compose restart compliance-api
```

---

## Health Checks

The container includes automated health checks:

```
Interval: 30 seconds
Timeout: 10 seconds
Retries: 3
Start period: 5 seconds
```

### Check Status
```bash
docker ps
# Shows health status in STATUS column
# HEALTHY / UNHEALTHY / starting
```

### Manual Health Check
```bash
curl http://localhost:3001/health
```

---

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs compliance-api

# Check if port is in use
netstat -an | grep 3001

# Use different port
docker run -p 3002:3001 --env-file .env compliance-api:2.0.0
```

### Database Connection Failed
```bash
# Verify .env is correct
cat .env

# Check if database is accessible from container
docker exec compliance-api ping your-sql-server

# Ensure database credentials are correct
# Update .env and restart
docker-compose restart
```

### Container Exits Immediately
```bash
# Check logs for errors
docker logs compliance-api

# Run in foreground to see output
docker run --env-file .env compliance-api:2.0.0
```

### Port Already in Use
```bash
# Use different port
docker run -p 3002:3001 --env-file .env compliance-api:2.0.0

# Or kill process on port 3001
# Windows: netstat -ano | findstr 3001
# Linux: lsof -i :3001
```

---

## Advanced Usage

### Mount Volume for Logs
```bash
docker run -p 3001:3001 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  compliance-api:2.0.0
```

### Network
```bash
# Create custom network
docker network create compliance-net

# Run with custom network
docker run -p 3001:3001 \
  --env-file .env \
  --network compliance-net \
  --name api \
  compliance-api:2.0.0
```

### CPU and Memory Limits
```bash
docker run -p 3001:3001 \
  --env-file .env \
  --memory=512m \
  --cpus=0.5 \
  compliance-api:2.0.0
```

---

## Production Deployment

### Use Docker Registry
```bash
# Tag image for registry
docker tag compliance-api:2.0.0 myregistry.azurecr.io/compliance-api:2.0.0

# Push to registry
docker push myregistry.azurecr.io/compliance-api:2.0.0

# Pull from registry
docker pull myregistry.azurecr.io/compliance-api:2.0.0
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: compliance-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: compliance-api
  template:
    metadata:
      labels:
        app: compliance-api
    spec:
      containers:
      - name: compliance-api
        image: compliance-api:2.0.0
        ports:
        - containerPort: 3001
        env:
        - name: PORT
          value: "3001"
        - name: DB_SERVER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: server
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
```

### Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy service
docker service create \
  --name compliance-api \
  -p 3001:3001 \
  --env-file .env \
  compliance-api:2.0.0

# Scale service
docker service scale compliance-api=3

# Remove service
docker service rm compliance-api
```

---

## Image Optimization

### Current Size
- Base: node:18-alpine (~150MB)
- Dependencies: npm packages (~100MB)
- Application: source code (~5MB)
- **Total: ~100MB** (final layer only)

### Size Reduction Options
If needed, you can optimize further:

```dockerfile
# Use multi-stage build (already implemented)
# Remove dev dependencies (already done with --production)
# Use distroless base (advanced)
# FROM gcr.io/distroless/nodejs18-debian11
```

---

## Best Practices

✅ Use multi-stage builds (✓ done)
✅ Run as non-root user (✓ done)
✅ Include health checks (✓ done)
✅ Use Alpine Linux (✓ done)
✅ Production dependencies only (✓ done)
✅ Semantic versioning (✓ 2.0.0)
✅ Document environment variables (✓ .env.example)
✅ Automated health checks (✓ health endpoint)

---

## Quick Reference

| Task | Command |
|------|---------|
| Build image | `docker build -t compliance-api:2.0.0 .` |
| Run container | `docker run -p 3001:3001 --env-file .env compliance-api:2.0.0` |
| Start with Compose | `docker-compose up -d` |
| View logs | `docker logs -f compliance-api` |
| Stop container | `docker stop compliance-api` |
| Health check | `curl http://localhost:3001/health` |
| List images | `docker images` |
| List containers | `docker ps -a` |

---

## Support

For issues or questions:
1. Check container logs: `docker logs compliance-api`
2. Verify .env configuration
3. Test database connectivity
4. Ensure port 3001 is available
5. Check Docker is running

---

**Version:** 2.0.0  
**Base Image:** node:18-alpine  
**Final Size:** ~100MB  
**Status:** Production Ready
