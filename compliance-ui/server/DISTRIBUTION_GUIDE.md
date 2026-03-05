# Compliance API - Distribution Guide

## Quick Start

Build a distribution package for the Compliance API:

```bash
npm run build:dist
```

This creates a complete distribution package with all necessary files, documentation, and archives.

## Build Output

The distribution package includes:

```
dist/
├── compliance-api-2.0.0/              # Package directory
│   ├── src/                           # Production source code
│   ├── package.json                   # Dependencies
│   ├── .env.example                   # Configuration template
│   ├── README.md                      # Quick start
│   ├── SETUP.md                       # Installation guide
│   ├── DISTRIBUTION.md                # Package documentation
│   ├── ARCHITECTURE.md                # System design
│   ├── DEVELOPER_GUIDE.md             # Development guide
│   ├── MANIFEST.md                    # Package contents
│   └── CHANGELOG.md                   # Version history
├── compliance-api-2.0.0.tar.gz        # Unix/Linux archive
├── compliance-api-2.0.0.zip           # Windows archive
└── DISTRIBUTION_SUMMARY.md            # Distribution overview
```

## Build Commands

### Standard Build
```bash
# Creates distribution package in ./dist directory
npm run build:dist
```

### Custom Version
```bash
# Create package with specific version
node build-distribution.js 2.1.0
```

### Custom Output Directory
```bash
# Specify custom output directory
node build-distribution.js 2.0.0 ./releases
```

## Package Contents

Each distribution includes:

- **src/** - Complete source code (production-ready)
- **package.json** - All dependencies specified
- **package-lock.json** - Locked versions for reproducible builds
- **.env.example** - Environment variables template
- **README.md** - Quick start guide
- **SETUP.md** - Comprehensive setup instructions
- **DISTRIBUTION.md** - Package overview and endpoints
- **ARCHITECTURE.md** - System architecture documentation
- **DEVELOPER_GUIDE.md** - Development information
- **MANIFEST.md** - Manifest of contents
- **CHANGELOG.md** - Version history
- **.gitignore** - Git ignore rules
- **.npmignore** - NPM ignore rules

## What's Excluded

The distribution excludes:

- `node_modules/` - Users will install via `npm install`
- `coverage/` - Test coverage reports
- `.git/` - Git history
- Test files (`*.test.js`) - Kept for reference in src folder
- Build scripts - Only `build-distribution.js` included for rebuilding
- Development-only dependencies

## Distribution Formats

### Tar.gz (Unix/Linux)
```bash
tar -xzf compliance-api-2.0.0.tar.gz
cd compliance-api-2.0.0
npm install
```

### Zip (Windows)
```bash
Expand-Archive compliance-api-2.0.0.zip
cd compliance-api-2.0.0
npm install
```

### Folder (Direct)
```bash
cd compliance-api-2.0.0
npm install
```

## Installation for End Users

1. **Extract the archive:**
   ```bash
   tar -xzf compliance-api-2.0.0.tar.gz
   # or unzip compliance-api-2.0.0.zip
   cd compliance-api-2.0.0
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your SQL Server settings
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Verify it's running:**
   ```bash
   curl http://localhost:3001/health
   ```

## Configuration

See `SETUP.md` in the distribution package for:
- Environment variables
- Database connection setup
- Production deployment options
- Troubleshooting guide

## Documentation

All documentation is included in the distribution:

| Document | Purpose |
|----------|---------|
| README.md | Quick start and overview |
| SETUP.md | Installation and configuration |
| DISTRIBUTION.md | Package contents and API endpoints |
| ARCHITECTURE.md | System design and patterns |
| DEVELOPER_GUIDE.md | Development setup |
| MANIFEST.md | Package manifest |
| CHANGELOG.md | Version history |

## Deployment Options

The package supports multiple deployment options:

1. **Standalone Node.js Server**
   - Direct `npm start` execution
   - PM2 for process management
   - Windows Service via NSSM

2. **Docker Container**
   - Dockerfile included in source
   - Docker Compose support
   - Environment variable configuration

3. **IIS/Reverse Proxy**
   - Node.js backend
   - IIS URL rewriting
   - SSL/HTTPS support

See `SETUP.md` in the distribution for detailed deployment instructions.

## Size and Performance

- **Package size:** ~50 MB (with node_modules after npm install)
- **Uncompressed:** ~20 MB (source code and documentation)
- **Tar.gz:** ~5-8 MB (compressed)
- **Zip:** ~5-8 MB (compressed)

Typical installation time: 2-5 minutes (depends on network speed)

## Version Management

The build script uses the version from `package.json`:

```json
{
    "name": "compliance-api",
    "version": "2.0.0",
    ...
}
```

To create a new version:

1. Update version in package.json
2. Run `npm run build:dist`
3. Archives will use the new version number

## Rebuilding Distribution

To rebuild the distribution package (after code changes):

```bash
# Update version if needed
npm version minor  # or patch, major

# Build new distribution
npm run build:dist
```

This creates fresh archives with all current code.

## Distribution Checklist

Before distributing:

- [ ] All tests pass: `npm test`
- [ ] Code is clean: No console.log, TODO comments, debug code
- [ ] README.md updated with latest features
- [ ] CHANGELOG.md updated with changes
- [ ] Version updated in package.json
- [ ] Environment template (.env.example) updated
- [ ] Documentation is complete and accurate
- [ ] Distribution package built: `npm run build:dist`
- [ ] Archives verified (contents and extraction)
- [ ] Installation tested from archive

## Support Files

Each distribution includes:

- **SETUP.md** - For troubleshooting and installation
- **DISTRIBUTION.md** - For package overview
- **DEVELOPER_GUIDE.md** - For development questions
- **ARCHITECTURE.md** - For technical questions

Users should reference these documents first for support.

## Updating Distribution

To push updates:

1. Make code changes and commit
2. Update version in package.json
3. Update CHANGELOG.md
4. Run `npm run build:dist`
5. Test installation from new distribution
6. Share new distribution package

## Quality Assurance

The build script:

- ✓ Validates all included files exist
- ✓ Excludes build artifacts and node_modules
- ✓ Includes all documentation
- ✓ Creates multiple archive formats
- ✓ Generates distribution summary
- ✓ Reports package size

## Next Steps

1. Run `npm run build:dist`
2. Test installation from `dist/compliance-api-2.0.0/`
3. Share distribution packages with users
4. Direct users to SETUP.md for installation

For more information, see individual documentation files in the distribution.
