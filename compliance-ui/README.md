# Union Hall Compliance Management System

A comprehensive React-based web application for managing union hall compliance reporting, hire data import, and compliance run execution.

## Features

- **Dashboard**: Import hire data via CSV and execute compliance runs
- **Reports**: View and search run information, report details, and export data
- **Data Management**: 
  - Import hire data from CSV files
  - Execute compliance runs with different modes
  - View detailed hire information
  - Search and filter compliance data
- **Excel Export**: Download complete compliance reports with hire details and summaries

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite (build tool)
- TanStack Query for server state management
- Axios for HTTP client
- Lucide React for icons
- XLSX for Excel export

### Backend
- Node.js with Express
- MSSQL for database
- Multer for file uploads
- CSV Parser for data parsing

## Project Structure

```
compliance-ui/
├── src/
│   ├── components/          # React components
│   │   ├── Alert.tsx
│   │   ├── DataTable.tsx
│   │   ├── FileUpload.tsx
│   │   ├── ReportViewer.tsx
│   │   └── RunExecutor.tsx
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   └── Reports.tsx
│   ├── services/            # API services
│   │   └── api.ts
│   ├── styles/              # CSS files
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── server/
│   ├── index.js             # Express API server
│   └── package.json
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env
```

## Prerequisites

- Node.js 18+
- npm or yarn
- SQL Server (with UnionHall database)
- The cmp-run.js file in the parent directory

## Installation

### Frontend Setup

```bash
# Install dependencies
npm install

# Install legacy peer dependencies if needed
npm install --legacy-peer-deps
```

### Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

For the backend, create a `.env` file in the `server` directory:

```env
PORT=3001
DB_USER=uh_admin
DB_PASSWORD=uh_admin
DB_SERVER=DESKTOP-DI29PVA\MSSQLSERVER01
DB_NAME=UnionHall
```

## Running the Application

### Development Mode

Open two terminals:

**Terminal 1 - Frontend:**
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`

**Terminal 2 - Backend:**
```bash
cd server
npm run dev
```
The backend API will be available at `http://localhost:3001`

### Production Build

```bash
# Build frontend
npm run build

# Production server start
npm run preview
```

## API Endpoints

### Runs
- `GET /api/runs` - List all compliance runs
- `GET /api/runs/:id` - Get a specific run
- `POST /api/runs/execute` - Execute a new compliance run

### Import
- `POST /api/import/hires` - Import hire data from CSV

### Reports
- `GET /api/reports` - List all reports with filters
- `GET /api/reports/run/:runId` - Get reports for a specific run

### Report Details
- `GET /api/report-details` - List all report details with filters
- `GET /api/report-details/run/:runId` - Get report details for a specific run

### Modes
- `GET /api/modes` - List available compliance modes

### Export
- `GET /api/export/data/:runId` - Get export data for a run
- `GET /api/export/run/:runId` - Download Excel file for a run

## CSV Import Format

The hire data import expects a CSV file with the following columns:

```
EmployerID,ContractorName,MemberName,IANumber,StartDate,HireType,IsReviewed,IsExcluded,EndDate,ContractorID,IsInactive,ReviewedDate,ExcludedComplianceRules,CreatedByUserName,CreatedByName,CreatedOn
```

Example:
```csv
EMP001,ABC Contractors,John Doe,12345,2026-01-01,Direct,0,0,,,0,,,ADMIN,Admin User,2026-01-13
```

## Usage

### 1. Import Hire Data
1. Navigate to the Dashboard
2. Use the File Upload component to upload a CSV file
3. View the import results

### 2. Execute a Compliance Run
1. On the Dashboard, fill in:
   - Reviewed Date (date picker)
   - Mode (dropdown from database)
   - Optional: Check "Dry Run" for preview-only
2. Click "Execute Run"
3. Monitor the execution results

### 3. View Reports
1. Navigate to Reports page
2. Select a run from the dropdown
3. Switch between tabs:
   - **Hire Details**: Detailed hire information with search
   - **Report Summary**: Contractor compliance summary
   - **Export Data**: Full data with Excel download option

### 4. Search and Filter
- Use the search boxes in tables to filter by contractor name or member name
- Click column headers to sort (where sortable)
- Search results update in real-time

### 5. Download Excel Reports
1. Go to Reports > Export Data tab
2. Select a run
3. Click "Download Excel Report"
4. Saves as `compliance_report_[runId].xlsx`

## Database Schema

The application uses these main tables:

- `CMP_Runs` - Compliance run executions
- `CMP_Reports` - Summary reports by contractor
- `CMP_ReportDetails` - Detailed hire information
- `CMP_ReviewedHires` - Imported hire data
- `CMP_Modes` - Available compliance modes

## Troubleshooting

### Database Connection Issues
- Verify SQL Server is running
- Check connection string in `.env`
- Ensure database and tables exist
- Check user permissions

### File Upload Fails
- Ensure CSV format matches expected schema
- Check file size (should be reasonable)
- Verify file is valid CSV

### Excel Export Issues
- Ensure XLSX library is installed
- Check file permissions
- Verify data is available in database

## Development

### Adding New Components
1. Create component in `src/components/`
2. Add TypeScript types if needed
3. Create corresponding CSS file
4. Import and use in pages

### Adding New API Endpoints
1. Add route in `server/index.js`
2. Add API method in `src/services/api.ts`
3. Add TypeScript type if needed
4. Use in components via React Query

## License

ISC

## Support

For issues or questions, contact the development team.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
