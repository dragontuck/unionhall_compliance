# Docker Container to Host SQL Server Configuration

## Overview

Your Docker container is now configured to communicate with SQL Server running on the host machine. This guide explains how to set it up.

---

## Configuration for Different Platforms

### Windows (Docker Desktop)

**Hostname:** `host.docker.internal`

Add to your `.env` file:
```env
DB_SERVER=host.docker.internal
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database
```

**Docker Compose:** Already configured with `extra_hosts` entry

### macOS (Docker Desktop)

**Hostname:** `host.docker.internal`

Same as Windows - use the `.env` configuration above.

**Docker Compose:** Already configured with `extra_hosts` entry

### Linux

**Option 1: Using host.docker.internal (Docker 20.10+)**

If your Docker version supports it, use:
```env
DB_SERVER=host.docker.internal
```

**Option 2: Using host network mode**

If `host.docker.internal` doesn't work, modify `docker-compose.yml`:
```yaml
services:
  compliance-api:
    # ... other config ...
    network_mode: host
```

Then use `localhost` or your host IP:
```env
DB_SERVER=localhost
# or
DB_SERVER=192.168.1.x  (your host IP)
```

---

## Updated Configuration Files

### docker-compose.yml Changes

Added `extra_hosts` entry to enable `host.docker.internal` hostname resolution:

```yaml
services:
  compliance-api:
    # ... other config ...
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

This allows the container to reach services on the host machine using `host.docker.internal` as the hostname.

### Dockerfile Changes

Removed duplicate `npm install` command that was running as non-root user (would have failed).

---

## Testing the Connection

### 1. Check Docker Network

```bash
# Verify extra_hosts is configured
docker-compose config | grep -A 2 extra_hosts
```

### 2. Test from Inside Container

```bash
# Start a test shell in the container
docker-compose exec compliance-api sh

# From inside the container, test connectivity:
# For SQL Server
telnet host.docker.internal 1433

# Or use Node to test
node -e "require('net').createConnection({host: 'host.docker.internal', port: 1433}, () => console.log('Connected!')).on('error', e => console.error('Failed:', e.message))"
```

### 3. Verify Environment Variables

```bash
# Check .env file is loaded
docker-compose exec compliance-api printenv | grep DB_
```

### 4. Check Application Logs

```bash
docker-compose logs compliance-api

# Follow logs in real-time
docker-compose logs -f compliance-api
```

---

## SQL Server Port Configuration

Make sure your SQL Server is listening on the correct port:

### Windows SQL Server (Default)

- **Port:** 1433 (TCP)
- **Check:** SQL Server Configuration Manager → SQL Server Network Configuration
- **Enable TCP/IP** if not already enabled

### Verify SQL Server is Accessible

From your Windows host:
```powershell
# Test connection from host
sqlcmd -S localhost -U your-user -P your-password

# Or use telnet
Test-NetConnection -ComputerName localhost -Port 1433
```

---

## Environment Setup

### .env File

```env
# Database Configuration for Host SQL Server
DB_SERVER=host.docker.internal
DB_USER=your-sql-server-user
DB_PASSWORD=your-secure-password
DB_NAME=your-database-name

# Application
NODE_ENV=production
LOG_LEVEL=info
PORT=3001
```

Replace:
- `your-sql-server-user` - Your SQL Server login (e.g., `sa`)
- `your-secure-password` - Your SQL Server password
- `your-database-name` - Your database name (e.g., `UnionHallCompliance`)

---

## Running the Container

### Using Docker Compose

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f compliance-api

# Stop
docker-compose down
```

### Using Docker Run Directly

```bash
docker run -d \
  --name compliance-api \
  -p 3001:3001 \
  --add-host host.docker.internal:host-gateway \
  -e DB_SERVER=host.docker.internal \
  -e DB_USER=your-user \
  -e DB_PASSWORD=your-password \
  -e DB_NAME=your-database \
  compliance-api:2.0.0
```

---

## Troubleshooting

### Container Can't Connect to SQL Server

**Error:** `Error: RequestError: Connection timeout`

**Solutions:**

1. **Verify SQL Server is running**
   ```bash
   Get-Service MSSQLSERVER
   ```

2. **Verify TCP/IP is enabled**
   - Open SQL Server Configuration Manager
   - Expand "SQL Server Network Configuration"
   - Select "Protocols for [INSTANCE]"
   - Ensure "TCP/IP" is Enabled

3. **Check SQL Server port**
   ```bash
   netstat -an | findstr :1433
   ```

4. **Test connectivity from host**
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 1433 -InformationLevel Detailed
   ```

5. **Verify container environment**
   ```bash
   docker-compose exec compliance-api sh
   # Inside container:
   env | grep DB_
   ```

### Wrong Hostname Used

**Issue:** Container resolves `host.docker.internal` to incorrect IP

**Solution:**
1. Use your actual host IP instead:
   ```env
   DB_SERVER=192.168.1.100  # Your Windows machine IP
   ```

2. Or disable firewall (temporarily for testing):
   ```powershell
   Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled $False
   ```

### Connection String Issues

**For .NET/SQL Server connections, verify format:**

```
Server=host.docker.internal;Database=YourDB;User Id=sa;Password=YourPassword;
```

**Connection timeout settings (if needed):**

```
Server=host.docker.internal,1433;Database=YourDB;User Id=sa;Password=YourPassword;Connection Timeout=30;
```

---

## Advanced Configuration

### Multiple Services

If you have multiple services that need SQL Server access:

```yaml
services:
  compliance-api:
    build: .
    extra_hosts:
      - "host.docker.internal:host-gateway"
      - "sql-server:host-gateway"
    environment:
      - DB_SERVER=host.docker.internal
      # or
      # - DB_SERVER=sql-server
  
  other-service:
    # ... similar config ...
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### Custom Network Configuration

For more complex setups:

```yaml
version: '3.9'

services:
  compliance-api:
    build: .
    ports:
      - "3001:3001"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

## Performance Optimization

For better performance with SQL Server on host:

1. **Enable connection pooling** (already in application code)
2. **Set reasonable timeouts** in `.env`
3. **Monitor resource usage:**
   ```bash
   docker stats compliance-api
   ```

4. **Optimize SQL queries** if experiencing slowness
5. **Check SQL Server performance** with SQL Server Management Studio

---

## Security Considerations

### Best Practices

1. **Never commit `.env` to git** - Add to `.gitignore`
2. **Use strong passwords** for SQL Server
3. **Limit SQL Server user permissions** to only needed databases
4. **Run container as non-root** (already configured)
5. **Use Docker secrets** for production deployments

### Production Deployment

For production, consider:

1. **Azure SQL Database** instead of host SQL Server
2. **Docker secrets** for sensitive data
3. **Kubernetes secrets** if using K8s
4. **VPN/SSL** for remote connections

---

## Verification Commands

```bash
# Check docker-compose is correctly configured
docker-compose config

# View all environment variables in container
docker-compose exec compliance-api env

# Test DNS resolution of host.docker.internal
docker-compose exec compliance-api ping host.docker.internal

# Check network connectivity to SQL Server port
docker-compose exec compliance-api sh
nslookup host.docker.internal
telnet host.docker.internal 1433  # Exit with Ctrl+] then quit
exit
```

---

## Summary

✅ **Docker Compose** - Automatically configured with `extra_hosts`  
✅ **Hostname** - Use `host.docker.internal` to reach host SQL Server  
✅ **Environment** - Configure via `.env` file  
✅ **Port** - SQL Server typically on 1433  
✅ **Testing** - Use `docker-compose logs` to verify connection  

Your container is now ready to communicate with SQL Server running on your host machine!

---

**Need Help?**
- Check logs: `docker-compose logs -f compliance-api`
- Verify config: `docker-compose config`
- Test connection: `docker-compose exec compliance-api telnet host.docker.internal 1433`
