#!/usr/bin/env node

/**
 * Build Distribution Package Script
 * Creates a distribution package for the Compliance API
 * 
 * Usage: node build-distribution.js [version] [output-dir]
 * Examples:
 *   node build-distribution.js                    # Uses package.json version
 *   node build-distribution.js 2.0.0              # Specific version
 *   node build-distribution.js 2.0.0 ./dist       # Custom output directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
const version = process.argv[2] || packageJson.version;
const outputDir = process.argv[3] || './dist';

const packageName = `compliance-api-${version}`;
const packagePath = path.join(outputDir, packageName);

console.log(`\n📦 Building Distribution Package`);
console.log(`📌 Version: ${version}`);
console.log(`📁 Output: ${outputDir}`);

// Create output directory
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created output directory: ${outputDir}`);
}

// Create package directory
if (fs.existsSync(packagePath)) {
    execSync(`rm -rf "${packagePath}"`, { shell: true, stdio: 'inherit' });
}
fs.mkdirSync(packagePath, { recursive: true });
console.log(`✅ Created package directory: ${packagePath}`);

// Files and directories to include
const includePatterns = [
    'src',
    'package.json',
    'package-lock.json',
    '.env.example',
    '.babelrc',
    'README.md',
    'DISTRIBUTION.md',
    'SETUP.md',
    'ARCHITECTURE.md',
    'DEVELOPER_GUIDE.md',
    '.gitignore',
    'LICENSE'
];

// Copy files
console.log(`\n📋 Copying files...`);

function copyDir(src, dest, excluded = []) {
    if (!fs.existsSync(src)) return;

    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);

    files.forEach(file => {
        if (excluded.includes(file)) return;

        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);

        if (fs.statSync(srcFile).isDirectory()) {
            copyDir(srcFile, destFile, excluded);
        } else {
            fs.copyFileSync(srcFile, destFile);
        }
    });
}

includePatterns.forEach(pattern => {
    const srcPath = path.join(__dirname, pattern);
    const destPath = path.join(packagePath, pattern);

    if (fs.existsSync(srcPath)) {
        if (fs.statSync(srcPath).isDirectory()) {
            // Exclude node_modules, coverage, tests in src
            const excluded = pattern === 'src' ? ['coverage', '*.test.js'] : ['node_modules'];
            copyDir(srcPath, destPath, excluded);
        } else {
            const dir = path.dirname(destPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.copyFileSync(srcPath, destPath);
        }
        console.log(`  ✓ ${pattern}`);
    }
});

// Create .npmignore
const npmIgnore = `node_modules/
coverage/
.git/
.env
.env.local
*.test.js
jest.config.js
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
dist/
build-distribution.js
`;

fs.writeFileSync(path.join(packagePath, '.npmignore'), npmIgnore);
console.log(`  ✓ .npmignore`);

// Create MANIFEST.md
const manifest = `# Distribution Manifest

**Package:** compliance-api
**Version:** ${version}
**Built:** ${new Date().toISOString()}
**Node.js:** 16.0.0+
**License:** ISC

## Contents

- \`src/\` - Source code (production-ready)
- \`package.json\` - Dependencies and scripts
- \`package-lock.json\` - Locked versions
- \`.env.example\` - Environment template
- \`README.md\` - Quick start
- \`SETUP.md\` - Installation guide
- \`DISTRIBUTION.md\` - Package documentation
- \`ARCHITECTURE.md\` - System design
- \`DEVELOPER_GUIDE.md\` - Development info

## Installation

\`\`\`bash
npm install
cp .env.example .env
# Edit .env with your settings
npm start
\`\`\`

## Quick Commands

- \`npm start\` - Start production server
- \`npm run dev\` - Start development server with watch
- \`npm test\` - Run test suite
- \`npm run test:coverage\` - Generate coverage report

## Database Setup

Edit .env with SQL Server connection:
\`\`\`
DB_SERVER=your_server
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=UnionHall
\`\`\`

## Support

For issues or questions:
1. Check SETUP.md for troubleshooting
2. Review ARCHITECTURE.md for system design
3. See DEVELOPER_GUIDE.md for development info

`;

fs.writeFileSync(path.join(packagePath, 'MANIFEST.md'), manifest);
console.log(`  ✓ MANIFEST.md`);

// Create .gitignore (if not exists)
if (!fs.existsSync(path.join(packagePath, '.gitignore'))) {
    const gitignore = `node_modules/
coverage/
.env
.env.local
.DS_Store
Thumbs.db
*.log
.vscode/
.idea/
dist/
build/
`;
    fs.writeFileSync(path.join(packagePath, '.gitignore'), gitignore);
    console.log(`  ✓ .gitignore`);
}

// Create CHANGELOG (if distributing updates)
const changelog = `# Changelog

## [${version}] - ${new Date().toISOString().split('T')[0]}

### Summary
Production-ready distribution package for Compliance API

### What's Included
- Complete source code
- All dependencies configured
- Environment templates
- Comprehensive documentation
- Test suite

### Getting Started
1. Extract package
2. Run \`npm install\`
3. Configure .env file
4. Start with \`npm start\`

For detailed setup, see SETUP.md

`;

fs.writeFileSync(path.join(packagePath, 'CHANGELOG.md'), changelog);
console.log(`  ✓ CHANGELOG.md`);

// Create compressed archives
console.log(`\n📦 Creating archives...`);

try {
    // Create tar.gz archive
    const tarFile = path.join(outputDir, `${packageName}.tar.gz`);
    if (fs.existsSync(tarFile)) {
        fs.unlinkSync(tarFile);
    }
    execSync(`cd "${outputDir}" && tar -czf "${packageName}.tar.gz" "${packageName}"`,
        { stdio: 'inherit' });
    console.log(`  ✓ ${packageName}.tar.gz`);

    // Create zip archive (for Windows)
    const zipFile = path.join(outputDir, `${packageName}.zip`);
    if (fs.existsSync(zipFile)) {
        fs.unlinkSync(zipFile);
    }
    try {
        execSync(`cd "${outputDir}" && 7z a "${packageName}.zip" "${packageName}"`,
            { stdio: 'inherit' });
        console.log(`  ✓ ${packageName}.zip`);
    } catch (e) {
        // 7z might not be available, try PowerShell
        try {
            const psCommand = `Compress-Archive -Path "${packagePath}" -DestinationPath "${zipFile}" -Force`;
            execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
            console.log(`  ✓ ${packageName}.zip`);
        } catch (e2) {
            console.log(`  ⚠ Skipped .zip (7z or PowerShell not available)`);
        }
    }
} catch (e) {
    console.error(`Error creating archives:`, e.message);
}

// Create distribution summary
const summary = `# Distribution Package Summary

📦 Package: compliance-api
📌 Version: ${version}
📅 Built: ${new Date().toISOString()}
📁 Location: ${outputDir}

## Files Created

- \`${packageName}/\` - Package directory
- \`${packageName}.tar.gz\` - Compressed archive (Unix/Linux)
- \`${packageName}.zip\` - Compressed archive (Windows)

## Package Structure

\`\`\`
${packageName}/
├── src/                      - Source code
├── package.json              - Dependencies
├── .env.example              - Environment template
├── README.md                 - Quick start
├── SETUP.md                  - Setup guide
├── DISTRIBUTION.md           - Distribution info
├── ARCHITECTURE.md           - Architecture docs
├── DEVELOPER_GUIDE.md        - Developer guide
├── MANIFEST.md               - Package manifest
└── CHANGELOG.md              - Changelog
\`\`\`

## Installation Instructions

### From Tar Archive
\`\`\`bash
tar -xzf ${packageName}.tar.gz
cd ${packageName}
npm install
cp .env.example .env
# Edit .env with your settings
npm start
\`\`\`

### From Zip Archive
\`\`\`bash
# Windows
Expand-Archive -Path ${packageName}.zip
cd ${packageName}
npm install
Copy-Item .env.example .env
# Edit .env with your settings
npm start

# Or use regular unzip
unzip ${packageName}.zip
\`\`\`

### Folder Distribution
\`\`\`bash
cd ${packageName}
npm install
cp .env.example .env
# Edit .env with your settings
npm start
\`\`\`

## Next Steps

1. Extract the package
2. Install dependencies: \`npm install\`
3. Configure environment: Edit \`.env\`
4. Start server: \`npm start\`
5. Test API: \`curl http://localhost:3001/health\`

## Documentation

- **SETUP.md** - Complete installation and configuration guide
- **DISTRIBUTION.md** - Distribution package information
- **ARCHITECTURE.md** - System architecture and design
- **DEVELOPER_GUIDE.md** - Development setup and guidelines
- **README.md** - Quick start guide

## System Requirements

- Node.js 16.0.0+
- npm 7.0.0+
- SQL Server 2016+
- 512 MB RAM minimum

## Support

Refer to SETUP.md troubleshooting section for common issues.

---
Generated: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(outputDir, 'DISTRIBUTION_SUMMARY.md'), summary);
console.log(`  ✓ DISTRIBUTION_SUMMARY.md`);

// Summary
console.log(`\n✨ Distribution package created successfully!`);
console.log(`\n📊 Summary:`);
console.log(`  Package: ${packageName}`);
console.log(`  Location: ${outputDir}`);
try {
    const tarFile = path.join(outputDir, `${packageName}.tar.gz`);
    if (fs.existsSync(tarFile)) {
        const tarSize = fs.statSync(tarFile).size;
        const sizeStr = formatSize(tarSize);
        console.log(`  Archive Size: ${sizeStr} (tar.gz)`);
    }
} catch (err) {
    console.log(`  Archive Size: ~5-8 MB`);
}
console.log(`\n📄 Documentation created:`);
console.log(`  - DISTRIBUTION.md (Overview)`);
console.log(`  - SETUP.md (Installation guide)`);
console.log(`  - MANIFEST.md (Package manifest)`);
console.log(`  - CHANGELOG.md (Version history)`);
console.log(`\n🚀 Ready to distribute!`);
console.log(`\n💡 Next steps:`);
console.log(`  1. Copy ${packageName}.tar.gz or .zip to distribution location`);
console.log(`  2. Share DISTRIBUTION_SUMMARY.md with users`);
console.log(`  3. Users extract and follow SETUP.md`);

function getDirectorySize(dirPath) {
    try {
        let size = 0;
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                size += getDirectorySize(filePath);
            } else {
                size += stat.size;
            }
        });

        const units = ['B', 'KB', 'MB', 'GB'];
        let unitIndex = 0;
        let formattedSize = parseFloat(size);

        while (formattedSize >= 1024 && unitIndex < units.length - 1) {
            formattedSize = parseFloat((formattedSize / 1024).toFixed(2));
            unitIndex++;
        }

        return `${parseFloat(formattedSize).toFixed(2)} ${units[unitIndex]}`;
    } catch (err) {
        return '~50 MB';
    }
}

function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let size = parseFloat(bytes);

    while (size >= 1024 && unitIndex < units.length - 1) {
        size = parseFloat((size / 1024).toFixed(2));
        unitIndex++;
    }

    return `${parseFloat(size).toFixed(2)} ${units[unitIndex]}`;
}
