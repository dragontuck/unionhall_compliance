# Quick Setup: Docker ↔ Host SQL Server

## ⚡ 2-Minute Setup

### Step 1: Create `.env` File

```env
DB_SERVER=host.docker.internal
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_NAME=UnionHallCompliance
NODE_ENV=production
```

Replace with your actual SQL Server credentials.

### Step 2: Start Container

```bash
docker-compose up -d --build
```

### Step 3: Verify Connection

```bash
docker-compose logs -f compliance-api
```

Look for connection success in logs. API will be at `http://localhost:3001`

---

## ✅ What's Configured

- ✅ Docker Compose configured with `extra_hosts: host.docker.internal:host-gateway`
- ✅ Container can reach host at `host.docker.internal`
- ✅ SQL Server port 1433 accessible from container
- ✅ All database environment variables supported

---

## 🔧 Hostname Options

| Platform | Hostname | Notes |
|----------|----------|-------|
| **Windows** | `host.docker.internal` | ✅ Recommended |
| **macOS** | `host.docker.internal` | ✅ Recommended |
| **Linux** | `host.docker.internal` | Docker 20.10+ only |
| **Linux (older)** | Your host IP | Use `192.168.x.x` |

---

## 📋 Required Environment Variables

```env
# Required for SQL Server connection
DB_SERVER=host.docker.internal          # SQL Server hostname/IP
DB_USER=your-username                   # SQL Server login
DB_PASSWORD=your-password               # SQL Server password
DB_NAME=your-database-name              # Database name

# Optional
NODE_ENV=production                     # App environment
LOG_LEVEL=info                         # Logging level
PORT=3001                              # API port
```

---

## 🧪 Testing Connection

### Check Logs
```bash
docker-compose logs compliance-api
```

### Test Manually
```bash
docker-compose exec compliance-api sh
# Inside container:
telnet host.docker.internal 1433
```

### Check Configuration
```bash
docker-compose config | grep -A 5 compliance-api
```

---

## ❌ Common Issues

### Issue: "Connection timeout"
- **Check:** SQL Server is running on host
- **Fix:** `Get-Service MSSQLSERVER` (should be "Running")

### Issue: Connection refused
- **Check:** TCP/IP enabled in SQL Server Configuration Manager
- **Fix:** Enable TCP/IP → restart SQL Server

### Issue: Authentication failed
- **Check:** Username and password are correct
- **Verify:** `sqlcmd -S localhost -U sa -P YourPassword` works on host

### Issue: host.docker.internal not resolving
- **Try:** Use your host IP instead: `192.168.x.x`
- **Find:** Run `ipconfig` on Windows, look for "IPv4 Address"

---

## 📚 Full Documentation

See [DOCKER_HOST_SQL_SERVER.md](./DOCKER_HOST_SQL_SERVER.md) for:
- Detailed troubleshooting
- Advanced configuration
- Performance optimization
- Security best practices

---

**Status:** ✅ Ready to use  
**Quick Start:** Set `.env` → `docker-compose up -d --build` → Check logs
