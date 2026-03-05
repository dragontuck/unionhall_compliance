# Complete Deployment Workflow Guide

## 🎯 Overview

This guide covers the complete pipeline from development to production deployment for the Compliance API v2.0.0.

## 📋 Quick Start (5 minutes)

### 1. Create Distribution Package
```bash
npm run build:dist
# Creates:
# - dist/compliance-api-2.0.0.zip (149 KB)
# - dist/compliance-api-2.0.0.tar.gz (123 KB)
```

### 2. Build Docker Image
```bash
docker build -t compliance-api:2.0.0 .
# Result: 253 MB Docker image ready for deployment
```

### 3. Run Container
```bash
docker run -p 3001:3001 \
  -e DB_SERVER="your-server" \
  -e DB_USER="your-user" \
  -e DB_PASSWORD="your-password" \
  -e DB_NAME="compliance" \
  compliance-api:2.0.0
```

API will be available at: `http://localhost:3001`

---

## 📦 Distribution Package Details

### What's Included
```
compliance-api-2.0.0/
├── src/                           # Complete source code
│   ├── index.js                   # Application entry point
│   ├── Application.js             # Main application class
│   ├── data/                      # Data access layer
│   │   ├── IRepository.js
│   │   ├── MssqlRepository.js
│   │   └── repositories/
│   └── ... (other modules)
├── package.json                   # Dependencies (252 packages)
├── package-lock.json              # Dependency lock file
├── .env.example                   # Environment template
├── .babelrc                       # Babel configuration
├── .gitignore                     # Git ignore rules
├── README.md                      # Quick start guide
├── SETUP.md                       # Installation guide
├── DISTRIBUTION.md                # Package information
├── ARCHITECTURE.md                # Architecture documentation
├── DEVELOPER_GUIDE.md             # Developer reference
├── MANIFEST.md                    # Package manifest
└── CHANGELOG.md                   # Version history
```

### Package Statistics
- **Total Files**: 100+ files
- **Source Lines**: ~10,000 LOC
- **Dependencies**: 252 npm packages
- **Documentation**: 8 guides
- **Package Size (zip)**: 149 KB
- **Package Size (tar.gz)**: 123 KB (compressed)

---

## 🐳 Docker Deployment

### Docker Build Process

**Stage 1 - Builder (node:18-alpine)**
1. Copy distribution package from `dist/`
2. Extract tar.gz (preferred) or zip archive
3. Install 252 npm dependencies
4. Run build: `npm install --production --omit=dev`

**Stage 2 - Runtime (node:18-alpine)**
1. Copy application files from builder
2. Create non-root user (nodejs:1001)
3. Set up health checks
4. Ready for deployment

### Build Commands

```bash
# Standard build (uses existing dist/)
docker build -t compliance-api:2.0.0 .

# Full rebuild from scratch
npm run build:dist && docker build -t compliance-api:2.0.0 .

# Build with custom tag
docker build -t myregistry/compliance-api:2.0.0 .

# View image details
docker images compliance-api
docker inspect compliance-api:2.0.0
```

### Run Container

```bash
# Basic run
docker run -p 3001:3001 \
  -e DB_SERVER="sql.example.com" \
  -e DB_USER="api_user" \
  -e DB_PASSWORD="secure_password" \
  -e DB_NAME="compliance" \
  compliance-api:2.0.0

# Run with environment file
docker run -p 3001:3001 --env-file .env compliance-api:2.0.0

# Run in background with name
docker run -d --name compliance-api \
  -p 3001:3001 \
  --env-file .env \
  compliance-api:2.0.0

# Run with volume mount for logs
docker run -d --name compliance-api \
  -p 3001:3001 \
  -v logs:/app/logs \
  --env-file .env \
  compliance-api:2.0.0
```

### Docker Compose Deployment

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f compliance-api

# Stop services
docker-compose down

# View status
docker-compose ps
```

**docker-compose.yml** configuration:
- Builds image: `compliance-api:2.0.0`
- Port mapping: `3001:3001`
- Environment: Loads from `.env`
- Health checks: Enabled with 30s interval

### Health Monitoring

```bash
# Check container health
docker inspect --format='{{json .State.Health.Status}}' compliance-api

# View health details
docker inspect --format='{{json .State.Health}}' compliance-api

# Stream logs
docker logs -f compliance-api

# Check API endpoint
curl http://localhost:3001/health
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Environment variables configured (.env file)
- [ ] Database server accessible and authenticated
- [ ] Docker image built: `docker build -t compliance-api:2.0.0 .`
- [ ] Docker image tested locally
- [ ] Ports available (3001 for API)
- [ ] Health checks passing
- [ ] Logs configured and accessible

### Deployment Options

#### Option 1: Docker (Single Host)
```bash
docker run -d --name compliance-api \
  -p 3001:3001 \
  --restart unless-stopped \
  --env-file /etc/compliance/.env \
  compliance-api:2.0.0
```

#### Option 2: Docker Compose (Development)
```bash
cd compliance-ui/server
docker-compose up -d
```

#### Option 3: Docker Swarm (Multi-host)
```bash
docker service create \
  --name compliance-api \
  --publish 3001:3001 \
  --env-file /etc/compliance/.env \
  compliance-api:2.0.0
```

#### Option 4: Kubernetes (Scalable)
```bash
kubectl apply -f deployment.yaml
# deployment.yaml should specify:
# - Image: compliance-api:2.0.0
# - Ports: 3001
# - Environment variables
# - Health checks
# - Resource limits
```

### Monitoring & Maintenance

```bash
# View logs
docker logs -f compliance-api

# Monitor resource usage
docker stats compliance-api

# Check health status
docker inspect compliance-api | grep -A 10 Health

# Update image
docker pull compliance-api:2.0.1
docker stop compliance-api
docker rm compliance-api
docker run -d ... compliance-api:2.0.1

# Rollback
docker stop compliance-api
docker rm compliance-api
docker run -d ... compliance-api:2.0.0
```

---

## 📝 Environment Configuration

### Required Variables
```bash
DB_SERVER=sql.example.com        # SQL Server hostname
DB_USER=api_user                 # Database user
DB_PASSWORD=secure_password      # Database password
DB_NAME=compliance               # Database name
```

### Optional Variables
```bash
NODE_ENV=production              # Environment (default: development)
LOG_LEVEL=info                   # Logging level
PORT=3001                        # API port (default: 3001)
```

### .env Example
```env
# Database Configuration
DB_SERVER=compliance-sql.example.com
DB_USER=compliance_api
DB_PASSWORD=YourSecurePassword123!
DB_NAME=UnionHallCompliance

# Application Configuration
NODE_ENV=production
LOG_LEVEL=info
PORT=3001

# Optional: Azure Settings (if using Azure authentication)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

---

## 🔍 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs compliance-api

# Common issues:
# 1. Database unreachable - verify DB_SERVER and credentials
# 2. Port already in use - change -p mapping
# 3. Missing environment variables - add to .env
```

### Health Check Failing
```bash
# The /health endpoint requires database connection
# Make sure DB_SERVER, DB_USER, DB_PASSWORD are correct

# Test connection manually
curl -v http://localhost:3001/health
```

### Performance Issues
```bash
# Check resource usage
docker stats compliance-api

# View application logs
docker logs -f compliance-api

# Increase container resources (if needed)
docker run ... -m 512m --cpus 1.0 compliance-api:2.0.0
```

---

## 📚 Related Documentation

- [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) - Comprehensive Docker guide
- [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md) - Quick start for Docker
- [DISTRIBUTION_GUIDE.md](./DISTRIBUTION_GUIDE.md) - Distribution package guide
- [SETUP.md](./SETUP.md) - Installation and setup guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

---

## 🎓 Key Concepts

### Distribution Package
A self-contained deployment package containing:
- Complete source code
- All dependencies (npm packages)
- Documentation and guides
- Configuration templates
- Both tar.gz and zip formats for cross-platform compatibility

### Docker Multi-Stage Build
1. **Builder Stage**: Compiles and installs everything
2. **Runtime Stage**: Copies only necessary files for production
- Benefits: Smaller final image, faster deployment, security

### Non-Root User
- Container runs as `nodejs:1001` (not root)
- Improves security posture
- Prevents privilege escalation

### Health Checks
- Automatic monitoring of container health
- Triggers restart if unhealthy
- Provides visibility into application status

---

**Version:** 2.0.0  
**Last Updated:** 2026-02-06  
**Status:** Production Ready ✅
