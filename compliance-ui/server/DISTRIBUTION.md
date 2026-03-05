# Compliance API - Distribution Package

## Overview
This document describes the distribution package for the Compliance API, a Node.js-based REST API for managing compliance operations with SQL Server integration.

**Version:** 2.0.0
**Node.js Version:** 16.0.0 or higher
**Database:** SQL Server 2016+

## Package Contents

```
compliance-api-2.0.0/
├── src/                          # Source code
│   ├── index.js                 # Application entry point
│   ├── Application.js           # Express app factory
│   ├── config/                  # Configuration
│   ├── controllers/             # Request handlers
│   ├── data/                    # Data access layer
│   ├── di/                      # Dependency injection
│   ├── errors/                  # Error classes
│   ├── middleware/              # Express middleware
│   ├── routes/                  # API routes
│   ├── services/                # Business logic
│   └── utils/                   # Utilities
├── .env.example                 # Environment variables template
├── .babelrc                      # Babel configuration
├── package.json                 # Node.js dependencies
├── package-lock.json            # Locked dependency versions
├── README.md                     # Quick start guide
├── SETUP.md                      # Detailed setup instructions
├── DISTRIBUTION.md              # This file
└── LICENSE                       # License information
```

## Installation

### Prerequisites
- Node.js 16.0.0 or higher
- npm 7.0.0 or higher
- SQL Server 2016 or later
- Network connectivity to SQL Server instance

### Quick Start

1. **Extract the package:**
   ```bash
   tar -xzf compliance-api-2.0.0.tar.gz
   cd compliance-api-2.0.0
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your SQL Server connection details.

4. **Start the server:**
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:3001`

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3001
DB_USER=your_username
DB_PASSWORD=your_password
DB_SERVER=your_server_name
DB_NAME=UnionHall
NODE_ENV=production
```

**Variables:**
- `PORT`: Server port (default: 3001)
- `DB_USER`: SQL Server username
- `DB_PASSWORD`: SQL Server password
- `DB_SERVER`: SQL Server instance name or IP
- `DB_NAME`: Database name (default: UnionHall)
- `NODE_ENV`: Environment (development/production)

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Hire Data Management
- `GET /api/hire-data` - List all hire data
- `POST /api/hire-data/import` - Import CSV file
- `POST /api/hire-data/export` - Export data as Excel

### Compliance Operations
- `GET /api/compliance/run` - Get compliance runs
- `POST /api/compliance/run` - Start new compliance run
- `GET /api/compliance/report` - Generate compliance report
- `POST /api/compliance/report/export` - Export report as Excel

### Mode Management
- `GET /api/mode` - Get current mode
- `PUT /api/mode` - Set compliance mode

## System Requirements

### Minimum
- CPU: 2 cores
- Memory: 512 MB RAM
- Storage: 100 MB free space

### Recommended
- CPU: 4+ cores
- Memory: 2 GB RAM
- Storage: 500 MB free space

## Deployment Options

### Option 1: Standalone Server
Deploy directly on Windows or Linux server with Node.js installed.

### Option 2: Docker Container
Use the provided Dockerfile for containerized deployment:
```bash
docker build -t compliance-api:2.0.0 .
docker run -p 3001:3001 --env-file .env compliance-api:2.0.0
```

### Option 3: Windows Service
Install as Windows Service using NSSM or pm2:
```bash
npm install -g pm2
pm2 start src/index.js --name "compliance-api"
pm2 save
pm2 startup
```

## Troubleshooting

### Database Connection Issues
- Verify SQL Server is running
- Check network connectivity to server
- Ensure credentials in .env are correct
- Verify database exists

### Port Already in Use
Change `PORT` in .env file or kill process using the port

### Module Not Found
Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Support and Documentation

- **README.md** - Quick start and overview
- **SETUP.md** - Detailed setup instructions
- **DEVELOPER_GUIDE.md** - Development information
- **ARCHITECTURE.md** - System architecture

## Version History

### 2.0.0 (Current)
- Refactored with SOLID principles
- Improved dependency injection
- Enhanced error handling
- Comprehensive test coverage
- Production-ready configuration

## License

See LICENSE file for details.
