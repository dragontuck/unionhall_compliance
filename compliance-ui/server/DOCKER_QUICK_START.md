# Docker Deployment - Quick Start

## One-Command Setup

```bash
# 1. Build distribution package
npm run build:dist

# 2. Configure environment
cp .env.example .env
# Edit .env with your database details

# 3. Build Docker image
docker build -t compliance-api:2.0.0 .

# 4. Run container
docker run -p 3001:3001 --env-file .env compliance-api:2.0.0
```

## OR Use Docker Compose (Recommended)

```bash
# Everything in one command
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## What the Dockerfile Does

```
1. ✓ Copies dist/compliance-api-2.0.0.zip to container
2. ✓ Extracts the ZIP file
3. ✓ Runs npm install
4. ✓ Runs npm start (automatically)
5. ✓ Exposes port 3001
6. ✓ Includes health checks
```

---

## Key Features

✅ **Two-Stage Build** - Optimized size (~100MB)
✅ **Secure** - Non-root user (nodejs)
✅ **Health Checks** - Auto-monitoring
✅ **Alpine Linux** - Small, fast, secure
✅ **Production Ready** - All best practices
✅ **Easy Deployment** - Simple configuration

---

## File Structure Inside Container

```
/app/
├── src/                    Source code
├── package.json           Dependencies
├── package-lock.json      Locked versions
├── .env (provided)        Configuration
├── SETUP.md              Installation guide
├── DISTRIBUTION.md       Package info
└── [other files]         Complete app
```

---

## Verify It Works

```bash
# Check if running
docker ps

# Check logs
docker logs compliance-api

# Test API
curl http://localhost:3001/health

# Should return:
# {"status":"OK","timestamp":"...","database":"connected"}
```

---

## Common Commands

```bash
# Build
docker build -t compliance-api:2.0.0 .

# Run (foreground)
docker run -p 3001:3001 --env-file .env compliance-api:2.0.0

# Run (background)
docker run -d -p 3001:3001 --env-file .env \
  --name compliance-api compliance-api:2.0.0

# Stop
docker stop compliance-api

# Logs
docker logs -f compliance-api

# Remove
docker rm compliance-api

# With Compose
docker-compose up -d
docker-compose logs -f
docker-compose down
```

---

## Docker Compose Quick Reference

```bash
# Start
docker-compose up -d

# Rebuild and start
docker-compose up -d --build

# Stop
docker-compose down

# Logs
docker-compose logs -f compliance-api

# Restart
docker-compose restart compliance-api

# Stop specific service
docker-compose stop compliance-api

# Remove containers and images
docker-compose down --rmi all
```

---

## Troubleshooting

**Port Already in Use:**
```bash
# Use different port
docker run -p 3002:3001 --env-file .env compliance-api:2.0.0
```

**Database Connection Failed:**
```bash
# Check .env is correct
cat .env

# Check SQL Server is accessible
docker exec compliance-api ping your-sql-server
```

**Container Exits Immediately:**
```bash
# Check logs
docker logs compliance-api

# Run in foreground to see errors
docker run --env-file .env compliance-api:2.0.0
```

---

## Summary

| Item | Details |
|------|---------|
| **Base Image** | node:18-alpine |
| **Distribution** | dist/compliance-api-2.0.0.zip |
| **Port** | 3001 |
| **Size** | ~100MB |
| **User** | non-root (nodejs) |
| **Health Check** | /health endpoint |
| **Restart** | unless-stopped |
| **Production Ready** | ✅ Yes |

---

**Ready to deploy!** Start with `npm run build:dist` then `docker-compose up -d`
