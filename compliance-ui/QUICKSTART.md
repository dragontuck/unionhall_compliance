# Quick Start Guide

## Project Setup Complete ✓

The Union Hall Compliance Management System has been successfully created with all components.

## What's Been Created

### Frontend (React + TypeScript + Vite)
- **Dashboard Page**: Import hire data and execute compliance runs
- **Reports Page**: View and search compliance reports with export functionality
- **Components**:
  - `FileUpload`: Drag-and-drop CSV import
  - `RunExecutor`: Execute compliance runs with mode selection
  - `ReportViewer`: Multi-tab report viewer with search and sorting
  - `DataTable`: Reusable table with search, sort, and pagination
  - `Alert`: Toast-like notifications

### Backend API (Express.js)
- RESTful API for all compliance operations
- Database integration with SQL Server
- File upload and CSV parsing
- Excel export functionality
- Endpoints for runs, reports, report details, and modes

### Database Integration
- Connects to UnionHall SQL Server database
- Uses tables: CMP_Runs, CMP_Reports, CMP_ReportDetails, CMP_ReviewedHires, CMP_Modes

## Directory Structure

```
compliance-ui/
├── src/                    # Frontend code
│   ├── components/         # React components
│   ├── pages/             # Page components (Dashboard, Reports)
│   ├── services/          # API service layer
│   ├── styles/            # CSS files
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main app component with routing
│   └── main.tsx           # Entry point
├── server/                # Backend API
│   ├── index.js           # Express API server
│   └── package.json
├── dist/                  # Built frontend (created by build)
├── node_modules/          # Dependencies
├── .env                   # Environment variables
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration
└── README.md              # Full documentation
```

## Getting Started

### 1. Configure Database Connection

**For Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001/api
```

**For Backend (server/.env):**
```env
PORT=3001
DB_USER=uh_admin
DB_PASSWORD=uh_admin
DB_SERVER=DESKTOP-DI29PVA\\MSSQLSERVER01
DB_NAME=UnionHall
```

Adjust these values for your environment:
- If using a different SQL Server instance, update DB_SERVER
- If using different credentials, update DB_USER and DB_PASSWORD

### 2. Start the Backend Server

Open Terminal 1:
```bash
cd server
npm run dev
```

Expected output:
```
Server running on http://localhost:3001
Database connected successfully
```

### 3. Start the Frontend Development Server

Open Terminal 2:
```bash
npm run dev
```

Expected output:
```
VITE v7.3.1  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 4. Access the Application

Open your browser and navigate to: **http://localhost:5173**

## Features Overview

### Dashboard
1. **File Upload**: 
   - Drag and drop a CSV file with hire data
   - Supported columns: EmployerID, ContractorName, MemberName, IANumber, StartDate, HireType, IsReviewed, IsExcluded, EndDate, ContractorID, IsInactive, ReviewedDate, ExcludedComplianceRules, CreatedByUserName, CreatedByName, CreatedOn

2. **Execute Run**:
   - Select a Reviewed Date
   - Select a Compliance Mode from the database
   - Option to do a Dry Run (preview only)
   - Execute and view results

### Reports
1. **Select Run**: Choose from list of executed compliance runs
2. **View Tabs**:
   - **Hire Details**: Detailed hire information with search and sort
   - **Report Summary**: Contractor compliance summary
   - **Export Data**: Full data with download button
3. **Search & Filter**: Type to search contractor names or member names
4. **Sort**: Click column headers to sort (where available)
5. **Download**: Get complete Excel report with all data

## API Endpoints Reference

### Runs
- `GET /api/runs` - List all runs
- `GET /api/runs/:id` - Get specific run
- `POST /api/runs/execute` - Execute new run

### Import
- `POST /api/import/hires` - Import CSV file

### Reports
- `GET /api/reports` - List all reports
- `GET /api/reports/run/:runId` - Reports for specific run

### Report Details
- `GET /api/report-details` - List all details
- `GET /api/report-details/run/:runId` - Details for specific run

### Export
- `GET /api/export/data/:runId` - Get export data
- `GET /api/export/run/:runId` - Download Excel file

### Modes
- `GET /api/modes` - List available modes

## Troubleshooting

### Database Connection Failed
- Ensure SQL Server is running
- Verify server name in .env matches your installation
- Check credentials are correct
- Ensure UnionHall database exists
- Verify user has appropriate permissions

### Port Already in Use
- Frontend (5173): `npx kill-port 5173`
- Backend (3001): `npx kill-port 3001`
- Or change PORT in server/.env

### File Upload Issues
- Ensure CSV format matches expected schema
- Check file encoding (should be UTF-8)
- Verify column names match exactly

### Excel Export Not Working
- Ensure data exists in database for the run
- Check XLSX library is installed
- Verify browser allows file downloads

## Build for Production

### Frontend
```bash
npm run build
npm run preview
```

### Backend
```bash
cd server
npm start
```

## Development Tips

### Adding New Components
1. Create component in `src/components/`
2. Add TypeScript types in `src/types/`
3. Add corresponding CSS file in `src/styles/`
4. Export from component file

### Adding New API Endpoints
1. Add route in `server/index.js`
2. Add corresponding method in `src/services/api.ts`
3. Use in components with React Query

### Database Queries
- SQL Server is integrated via `mssql` npm package
- Connection pooling is handled automatically
- Use parameterized queries to prevent SQL injection

## Support

Refer to [README.md](./README.md) for detailed documentation including:
- Complete API reference
- CSV import format examples
- Database schema details
- Advanced configuration

## Next Steps

1. Test the application by uploading sample hire data
2. Execute a compliance run
3. View the generated reports
4. Download Excel export
5. Customize UI/API as needed for your requirements

---

**Status**: ✅ Project setup complete and ready to use!
