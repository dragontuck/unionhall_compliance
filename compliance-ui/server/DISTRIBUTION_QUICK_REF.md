# Distribution Package - Quick Reference

## One-Minute Overview

The Compliance API distribution package includes everything needed to deploy and run the API:

- **Complete source code** (production-ready)
- **All dependencies** configured (npm install)
- **Comprehensive documentation** (setup, architecture, developer guide)
- **Environment templates** (easy configuration)
- **Multiple archive formats** (tar.gz for Unix, zip for Windows)

## Creating a Distribution Package

```bash
# Build distribution package
npm run build:dist

# Output location: dist/compliance-api-2.0.0/
# Archives: .tar.gz and .zip
```

## What Gets Packaged

✅ **Included:**
- src/ - Complete source code
- package.json - Dependencies
- .env.example - Configuration template
- README.md - Quick start
- SETUP.md - Installation guide
- DISTRIBUTION.md - Package overview
- ARCHITECTURE.md - System design
- DEVELOPER_GUIDE.md - Development info

❌ **Excluded:**
- node_modules/ - Users install via npm
- coverage/ - Test reports
- .git/ - Repository history

## Distribution Folder Structure

```
compliance-api-2.0.0/
├── src/                      # Source code
├── package.json              # Dependencies
├── .env.example              # Config template
├── README.md                 # Quick start
├── SETUP.md                  # Installation
├── DISTRIBUTION.md           # Overview
├── ARCHITECTURE.md           # Design
└── [other docs]
```

## For End Users

### Installation (3 steps)
```bash
# 1. Extract
tar -xzf compliance-api-2.0.0.tar.gz
cd compliance-api-2.0.0

# 2. Install dependencies
npm install

# 3. Configure & run
cp .env.example .env
# Edit .env with your SQL Server details
npm start
```

### Configuration
```env
PORT=3001
DB_SERVER=your_server
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=UnionHall
```

### Verify It Works
```bash
curl http://localhost:3001/health
```

## Key Files in Distribution

| File | Purpose | Audience |
|------|---------|----------|
| README.md | Quick start | Everyone |
| SETUP.md | Installation guide | System admins |
| DISTRIBUTION.md | Package overview | End users |
| ARCHITECTURE.md | System design | Developers |
| DEVELOPER_GUIDE.md | Dev setup | Contributors |
| .env.example | Configuration | System admins |
| MANIFEST.md | Contents list | Auditors |

## Deployment Options

### Option 1: Direct (Simplest)
```bash
npm start
```

### Option 2: PM2 (Recommended for Production)
```bash
npm install -g pm2
pm2 start src/index.js --name compliance-api
pm2 save
pm2 startup
```

### Option 3: Docker
```bash
docker build -t compliance-api:2.0.0 .
docker run -p 3001:3001 --env-file .env compliance-api:2.0.0
```

### Option 4: Windows Service
```bash
# Using NSSM
nssm install ComplianceAPI "node" "C:\path\src\index.js"
nssm start ComplianceAPI
```

## API Endpoints

```
GET  /health                    - Health check
GET  /api/hire-data             - List hire data
POST /api/hire-data/import      - Import CSV
POST /api/hire-data/export      - Export Excel
POST /api/compliance/run        - Start compliance run
GET  /api/compliance/report     - Get report
PUT  /api/mode                  - Set mode
```

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 16.0.0 | 18+ LTS |
| RAM | 512 MB | 2 GB |
| Storage | 100 MB | 500 MB |
| SQL Server | 2016 | 2019+ |

## Build Scripts

```bash
npm start              # Start server
npm run dev           # Dev with auto-reload
npm test              # Run tests
npm run test:coverage # Coverage report
npm run build:dist    # Build distribution
```

## Environment Variables

```env
# Required
PORT=3001
DB_SERVER=server_name
DB_USER=username
DB_PASSWORD=password
DB_NAME=database_name

# Optional
NODE_ENV=production
```

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Port already in use | Change PORT in .env |
| DB connection failed | Check credentials and SQL Server status |
| Module not found | Run npm install |
| Out of memory | Set NODE memory flag |
| CORS errors | Check frontend URL in config |

## Documentation Structure

```
Distribution Package Docs
├── README.md                  - Start here (overview)
├── SETUP.md                   - Installation & config
├── DISTRIBUTION.md            - Package info & endpoints
├── DEVELOPER_GUIDE.md         - Development setup
├── ARCHITECTURE.md            - System design
├── DEPLOYMENT_CHECKLIST.md    - Pre-release checklist
└── DISTRIBUTION_GUIDE.md      - Build & distribution
```

## Common Tasks

### Update Configuration
```bash
# Edit environment variables
nano .env  # or use your editor
# Restart server
npm start
```

### Check Logs
```bash
# PM2
pm2 logs compliance-api

# Docker
docker logs container_name

# Standalone
# Check console output
```

### Run Tests
```bash
npm test                # Run once
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage
```

### Export Data
```bash
# API endpoint
POST http://localhost:3001/api/hire-data/export
```

## Version Information

- **Current Version:** 2.0.0
- **Node.js:** 16.0.0+
- **Database:** SQL Server 2016+
- **License:** ISC

## Getting Help

1. **Installation Issues** → See SETUP.md
2. **Architecture Questions** → See ARCHITECTURE.md
3. **API Usage** → See DISTRIBUTION.md
4. **Development Help** → See DEVELOPER_GUIDE.md
5. **Build Issues** → See DISTRIBUTION_GUIDE.md

## Quick Build Commands

```bash
# Standard build (uses version from package.json)
npm run build:dist

# Custom version
node build-distribution.js 2.1.0

# Custom output location
node build-distribution.js 2.0.0 ./releases
```

## Distribution Package Contents

After running `npm run build:dist`:

```
dist/
├── compliance-api-2.0.0/          # Uncompressed package
├── compliance-api-2.0.0.tar.gz    # Unix/Linux archive
├── compliance-api-2.0.0.zip       # Windows archive
└── DISTRIBUTION_SUMMARY.md        # Build summary
```

## Next Steps

1. **Build:** `npm run build:dist`
2. **Test:** Extract and run from dist folder
3. **Distribute:** Share tar.gz or zip with users
4. **Support:** Direct users to SETUP.md for installation

---

For detailed information, see the specific documentation files in the distribution package.
