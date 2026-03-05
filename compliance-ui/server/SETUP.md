# Compliance API - Setup Instructions

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Installation Steps](#installation-steps)
3. [Configuration](#configuration)
4. [Verification](#verification)
5. [Production Deployment](#production-deployment)

## Pre-Deployment Checklist

- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm 7+ installed (`npm --version`)
- [ ] SQL Server accessible and running
- [ ] Database created or migrations ready
- [ ] Network access verified to SQL Server
- [ ] Port 3001 available (or alternative configured)
- [ ] Firewall rules configured if needed

## Installation Steps

### 1. Extract Package
```bash
# Windows
tar -xf compliance-api-2.0.0.tar.gz
cd compliance-api-2.0.0

# Linux/Mac
tar -xzf compliance-api-2.0.0.tar.gz
cd compliance-api-2.0.0
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages listed in package.json:
- express (web framework)
- mssql (SQL Server driver)
- cors (cross-origin requests)
- multer (file uploads)
- csv-parser (CSV handling)
- xlsx (Excel export)
- dotenv (environment config)

### 3. Set Up Environment File
```bash
# Copy example file
cp .env.example .env

# Edit with your settings
# Windows
notepad .env
# Linux/Mac
nano .env
```

### 4. Configure SQL Server Connection

Edit `.env` with your SQL Server details:

```env
PORT=3001
DB_USER=your_sql_username
DB_PASSWORD=your_sql_password
DB_SERVER=SERVER_NAME\INSTANCE_NAME
DB_NAME=UnionHall
NODE_ENV=production
```

**Connection String Examples:**

Local SQL Server Express:
```
DB_SERVER=.\SQLEXPRESS
DB_USER=sa
DB_PASSWORD=YourPassword
```

Remote SQL Server:
```
DB_SERVER=192.168.1.100
DB_USER=admin
DB_PASSWORD=password123
```

Named Instance:
```
DB_SERVER=SERVERNAME\INSTANCE
DB_USER=domain\username
DB_PASSWORD=password
```

## Verification

### Test Installation
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Test Database Connection
The application includes connection diagnostics. Run once configured:
```bash
npm start
```

Watch for messages indicating successful database connection.

### API Health Check
Once running, verify with:
```bash
# In another terminal
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-02-06T10:30:00Z",
  "database": "connected"
}
```

## Configuration

### Port Configuration
To use a different port:

```env
PORT=3002
```

Then restart the application.

### Database Selection
Use different databases for different environments:

```env
# Development
DB_NAME=UnionHall_Dev

# Staging
DB_NAME=UnionHall_Stage

# Production
DB_NAME=UnionHall
```

### Environment Modes
Set the environment mode:

```env
# Development - detailed logging, relaxed CORS
NODE_ENV=development

# Production - optimized, strict CORS
NODE_ENV=production
```

## Production Deployment

### Using PM2 (Recommended)

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem.config.js:**
   ```javascript
   module.exports = {
     apps: [{
       name: 'compliance-api',
       script: './src/index.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       },
       error_file: './logs/error.log',
       out_file: './logs/output.log',
       log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
     }]
   };
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Using Docker

1. **Build image:**
   ```bash
   docker build -t compliance-api:2.0.0 .
   ```

2. **Run container:**
   ```bash
   docker run -d \
     -p 3001:3001 \
     -e DB_SERVER=sql-server-host \
     -e DB_USER=username \
     -e DB_PASSWORD=password \
     --name compliance-api \
     compliance-api:2.0.0
   ```

3. **View logs:**
   ```bash
   docker logs compliance-api
   ```

### Windows Service (NSSM)

1. **Download NSSM** from nssm.cc

2. **Install service:**
   ```bash
   nssm install ComplianceAPI "C:\path\to\node.exe" "C:\path\to\compliance-api\src\index.js"
   nssm set ComplianceAPI AppDirectory "C:\path\to\compliance-api"
   nssm set ComplianceAPI AppEnvironmentExtra PORT=3001
   ```

3. **Start service:**
   ```bash
   nssm start ComplianceAPI
   ```

### IIS with IIS URL Rewrite

1. **Install Application Request Routing (ARR)**
2. **Configure reverse proxy** to forward requests to Node.js app
3. **Set up SSL certificate** for HTTPS

## Monitoring

### Check Application Status
```bash
# PM2
pm2 status

# Docker
docker ps

# Windows Service
nssm status ComplianceAPI
```

### View Logs
```bash
# PM2
pm2 logs compliance-api

# Docker
docker logs compliance-api

# Windows Service
Event Viewer → Windows Logs → Application
```

### Database Monitoring
Monitor SQL Server:
- Check connection pool status
- Monitor query performance
- Review error logs

## Troubleshooting

### Issue: Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```
**Solution:** Port is already in use. Change PORT in .env

### Issue: Database Connection Failed
```
Error: Connection to database failed
```
**Solution:** 
- Verify SQL Server is running
- Check credentials in .env
- Verify network connectivity
- Check firewall rules

### Issue: Module Not Found
```
Error: Cannot find module 'express'
```
**Solution:**
```bash
npm install
npm ci  # Clean install from package-lock.json
```

### Issue: Out of Memory
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
```
**Solution:** Increase Node.js memory
```bash
node --max-old-space-size=4096 src/index.js
```

## Performance Tuning

### Increase Worker Processes
```javascript
// ecosystem.config.js
instances: 4,  // Set to number of CPU cores
```

### Connection Pool Settings
Set in .env or Application.js:
```javascript
// Max connections
max: 10

// Min idle connections
min: 2
```

### Enable Compression
Middleware already configured in Application.js

## Security Checklist

- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL in production
- [ ] Implement API authentication (if needed)
- [ ] Set up firewall rules
- [ ] Configure CORS appropriately
- [ ] Use .env file (never commit secrets)
- [ ] Regular security updates (`npm audit fix`)
- [ ] Monitor access logs

## Next Steps

1. Run the application: `npm start`
2. Test all endpoints
3. Set up monitoring
4. Configure backups
5. Plan disaster recovery

For additional help, see DEVELOPER_GUIDE.md and ARCHITECTURE.md.
