# Ramanathapuram District School Information Portal

A government-style, offline-ready school information dashboard built with React, TypeScript, and Vite.

## Overview

This application is designed for district education administration to:

- Review district-level school statistics
- Search and filter schools by taluk, block, and village
- Open a detailed school profile
- Import data from Excel spreadsheet files
- Analyse infrastructure gaps and data quality
- Review collector-level summaries
- Export validation reports for review

## Demo login

The app uses environment variables for the demo account so the credentials are not hard-coded into the frontend source.

Create a .env file in the project root with:

```env
VITE_DEMO_USERNAME=admin
VITE_DEMO_PASSWORD=admin123
```

Then log in with:

- Username / Mobile Number: admin
- Password: admin123

## Project structure

```text
School_Project/
├── src/
│   ├── data/
│   │   └── sampleSchools.ts
│   ├── types/
│   │   └── app.ts
│   ├── utils/
│   │   ├── schoolUtils.ts
│   │   └── schoolUtils.test.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .gitignore
├── .oxlintrc.json
├── .env.example
├── README.md
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── package-lock.json
```

## Setup instructions

1. Open the project folder in VS Code.
2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file:

```bash
copy .env.example .env
```

4. Start the app:

```bash
npm run dev
```

5. Open the local URL shown in the terminal.

## Run instructions

- Development server:

```bash
npm run dev
```

- Production build:

```bash
npm run build
```

- Linting:

```bash
npm run lint
```

- Tests:

```bash
npm run test
```

## Excel import format

Use a spreadsheet with columns such as:

- schoolName
- udiseCode
- schoolType
- management
- taluk
- block
- village
- totalStudents
- boys
- girls
- others
- totalTeachers
- classes
- medium
- address
- pinCode
- establishedYear

The importer can read .xlsx and .xls files and will attempt to map columns automatically.

## Data model

The application uses a simple local data structure with these core entities:

- District
- Taluk
- Block
- Village
- School
- Student statistics
- Teacher statistics
- Infrastructure
- Import history
- Users

School records are keyed by UDISE code when available. Duplicate UDISE codes are detected and updated or flagged during import.

## Testing results

Verified with fresh commands:

```bash
npm run test -- --run
npm run build
```

Results:

- 1 test file passed
- 3 tests passed
- Production build succeeded

## Known limitations

- This initial version stores data in browser local storage for offline/local development.
- It does not yet connect to a production backend database.
- Excel import is designed for local file-based workflows rather than large enterprise cloud integrations.

## Spreadsheet dependency security note

The portal currently uses `xlsx@0.18.5` because it supports both `.xlsx` and legacy `.xls` uploads and provides the required workbook and sheet-to-JSON APIs used by the import workflow.

`npm audit` reports a high-severity SheetJS prototype-pollution/ReDoS advisory for this version, and npm reports that no automated fix is available. The maintained alternatives reviewed do not provide an equivalent, low-risk replacement: `read-excel-file` does not support legacy `.xls`, while `exceljs` does not parse legacy `.xls`. Replacing the package now would therefore remove a currently supported upload format or require a separate conversion path.

Until a maintained parser with equivalent `.xlsx` and `.xls` support is available, keep spreadsheet uploads limited to trusted files from authorized users. Do not use `npm audit fix --force` or remove `xlsx` without implementing and testing a replacement parser first. Reassess this dependency before production deployment, preferably after moving file parsing to an isolated backend service with resource limits and malware scanning.

## Future enhancements

- Add a real backend and database such as SQLite or PostgreSQL
- Implement authenticated multi-user roles with RBAC
- Add PDF export and print-ready report templates
- Expand advanced Excel validation and duplicate handling
- Add map-based school location views
- Add API-driven import from government data feeds
