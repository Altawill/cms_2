# PDF & Excel Reporting System

## Overview

The reporting system provides comprehensive PDF and Excel export capabilities for site task management data. It supports bilingual output (English/Arabic), professional formatting, custom branding, and various export configurations.

## Features

### PDF Report Generator
- **Bilingual Support**: Full English and Arabic language support with proper RTL text handling
- **Professional Formatting**: Clean, structured layouts with tables, charts, and visual elements
- **Custom Branding**: Company logos, contact information, and branded headers/footers
- **Multiple Report Types**:
  - Site Progress Reports: Detailed task analysis, category breakdowns, timeline visualization
  - Client Status Reports: Project milestones, financial summaries, issues tracking
- **Digital Signatures**: Optional signature sections for stakeholder approval
- **Visual Elements**: Progress bars, status indicators, and color-coded sections

### Excel Export System
- **Multiple Export Types**: 
  - Tasks-only export for simple data sharing
  - Comprehensive reports with multiple worksheets
- **Advanced Filtering**: Filter by status, category, priority, assignee, and date ranges
- **Professional Formatting**: Color-coded cells, conditional formatting, auto-filters
- **Formula Integration**: Excel formulas for dynamic calculations and summaries
- **Multi-sheet Reports**: Separate sheets for summary, tasks, approvals, categories, and timeline

## Components

### PDF Components

#### `PDFReportGenerator` Component
```typescript
interface PDFReportGeneratorProps {
  site: Site
  tasks: SiteTask[]
  approvals: TaskApproval[]
  onClose?: () => void
}
```

**Features:**
- Interactive configuration panel with report type selection
- Date range picker for progress reports
- Language toggle (English/Arabic)
- Company branding customization
- Client information input for status reports
- Real-time preview with data summary

#### `PDFReportGenerator` Utility Class
```typescript
class PDFReportGenerator {
  constructor(config: ReportConfig)
  generateSiteProgressReport(data: SiteProgressReportData): string
  generateClientStatusReport(data: ClientStatusReportData): string
}
```

### Excel Components

#### `ExcelExporter` Component
```typescript
interface ExcelExporterProps {
  site: Site
  tasks: SiteTask[]
  approvals: TaskApproval[]
  onClose?: () => void
}
```

**Features:**
- Export type selection (tasks-only vs comprehensive)
- Advanced filtering interface with checkboxes for all task attributes
- Language selection for column headers and data
- Export options (formatting, formulas, charts)
- Real-time filtered data count preview

#### `ExcelExporter` Utility Class
```typescript
class ExcelExporter {
  constructor(config: ExcelExportConfig)
  exportSiteReport(site: Site, tasks: SiteTask[], approvals: TaskApproval[], filter?: ExportFilter): string
  exportTasksOnly(tasks: SiteTask[], filter?: ExportFilter): string
  exportApprovalsOnly(approvals: TaskApproval[]): string
}
```

## Data Structures

### Report Configuration
```typescript
interface ReportConfig {
  language: 'en' | 'ar'
  theme: 'light' | 'dark'
  includeLogo: boolean
  includeSignatures: boolean
  includeTimestamp: boolean
  customBranding?: {
    companyName: string
    logo?: string
    address: string
    phone: string
    email: string
  }
}
```

### Export Filters
```typescript
interface ExportFilter {
  status?: string[]
  category?: string[]
  priority?: string[]
  assignedTo?: string[]
  dateRange?: {
    startDate: string
    endDate: string
  }
}
```

## Usage Examples

### Basic PDF Report Generation
```typescript
import { PDFReportGenerator, prepareSiteProgressData } from '@/utils/reportGenerator'

const config: ReportConfig = {
  language: 'en',
  theme: 'light',
  includeLogo: true,
  includeSignatures: true,
  includeTimestamp: true,
  customBranding: {
    companyName: 'Your Company',
    address: 'Your Address',
    phone: 'Your Phone',
    email: 'your@email.com'
  }
}

const generator = new PDFReportGenerator(config)
const reportData = prepareSiteProgressData(site, tasks, approvals, startDate, endDate)
const pdfDataUri = generator.generateSiteProgressReport(reportData)

// Create download link
const link = document.createElement('a')
link.href = pdfDataUri
link.download = 'site-progress-report.pdf'
link.click()
```

### Excel Export with Filters
```typescript
import { downloadSiteReportAsExcel } from '@/utils/excelExporter'

const filter: ExportFilter = {
  status: ['in-progress', 'completed'],
  category: ['construction', 'safety'],
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  }
}

const config = {
  language: 'en' as const,
  includeFormatting: true,
  includeFormulas: true
}

downloadSiteReportAsExcel(site, tasks, approvals, 'site-report', config, filter)
```

### Integration in SiteTasks Component
```typescript
// Import reports
import { PDFReportGenerator, ExcelExporter } from '../../reports'

// State management
const [showPDFGenerator, setShowPDFGenerator] = useState(false)
const [showExcelExporter, setShowExcelExporter] = useState(false)

// UI buttons in header
<button onClick={() => setShowPDFGenerator(true)}>
  📄 PDF Report
</button>
<button onClick={() => setShowExcelExporter(true)}>
  📊 Excel Export
</button>

// Modal rendering
{showPDFGenerator && (
  <PDFReportGenerator
    site={site}
    tasks={siteTasks}
    approvals={approvals}
    onClose={() => setShowPDFGenerator(false)}
  />
)}
```

## Report Content

### Site Progress Report (PDF)
1. **Header Section**: Company branding, report title, generation timestamp
2. **Site Information**: Basic site details and project information
3. **Project Summary**: Key metrics, completion rates, time tracking
4. **Category Breakdown**: Tasks by category with completion statistics
5. **Task Details**: Comprehensive task list with status and progress
6. **Timeline**: Visual timeline of project progress
7. **Footer**: Page numbers, company info, optional signatures

### Client Status Report (PDF)
1. **Header Section**: Professional header with branding
2. **Client Information**: Client contact details and project overview
3. **Project Milestones**: Key milestones with progress tracking
4. **Financial Summary**: Budget, spending, and invoice information
5. **Upcoming Deadlines**: Critical dates and deliverables
6. **Issues & Concerns**: Active issues with severity levels
7. **Signatures**: Professional signature section for approvals

### Excel Comprehensive Report
1. **Summary Sheet**: Site information, statistics, and key metrics
2. **Tasks Sheet**: Complete task list with all fields and formatting
3. **Approvals Sheet**: Approval workflow data and status tracking
4. **Category Analysis**: Statistical breakdown by task categories
5. **Timeline Sheet**: Daily activity and progress tracking

## Localization

### Supported Languages
- **English (en)**: Default language with standard formatting
- **Arabic (ar)**: RTL support with Arabic date formatting and cultural adaptations

### Translation System
- Centralized translation dictionaries in utility classes
- Automatic currency formatting (USD for English, SAR for Arabic)
- Date formatting with appropriate locales
- Text direction handling for Arabic content

## Styling and Formatting

### PDF Styling
- Professional color schemes with consistent branding
- Progress bars and visual indicators
- Status badges with appropriate colors
- Conditional formatting based on task status and priority
- Page breaks and overflow handling

### Excel Formatting
- Color-coded cells based on task status and progress
- Conditional formatting for visual data analysis
- Auto-filters for interactive data exploration
- Column width optimization for readability
- Header styling with branded colors

## File Output

### PDF Reports
- Generated as data URI strings for immediate download
- A4 format with proper margins and spacing
- Multi-page support with headers and footers
- Professional typography and layout

### Excel Files
- `.xlsx` format with multiple sheets
- Preserved formatting and formulas
- Auto-filter capabilities
- Cell styling and conditional formatting

## Performance Considerations

### PDF Generation
- Efficient memory usage with streaming generation
- Page break optimization to prevent content splitting
- Lazy loading of images and assets
- Progress indication during generation

### Excel Export
- Optimized for large datasets
- Efficient data processing and filtering
- Minimal memory footprint
- Blob URL management with cleanup

## Future Enhancements

### Planned Features
1. **Chart Integration**: Visual charts and graphs in both PDF and Excel
2. **Template System**: Customizable report templates
3. **Automated Scheduling**: Scheduled report generation and delivery
4. **Email Integration**: Direct email delivery of reports
5. **Report History**: Track and manage generated reports
6. **Advanced Analytics**: Statistical analysis and trending
7. **Custom Fields**: User-defined fields in reports
8. **Watermarks**: Security watermarks for sensitive reports

### Technical Improvements
1. **Web Workers**: Background processing for large reports
2. **Compression**: Optimized file sizes for faster downloads
3. **Caching**: Report template and data caching
4. **Batch Processing**: Multiple site reports in single operation
5. **Real-time Preview**: Live preview as configuration changes
6. **API Integration**: Server-side report generation
7. **Cloud Storage**: Direct upload to cloud storage services

## Dependencies

### Required Packages
```json
{
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.5.29",
  "xlsx": "^0.18.5",
  "@types/jspdf": "^2.3.0"
}
```

### Peer Dependencies
- React 18+
- TypeScript 4.5+
- Modern browser with ES2020 support

## Integration Points

### SiteTasks Component
- PDF/Excel buttons in header toolbar
- Modal dialogs for report configuration
- Integration with existing task data and permissions

### Permission System
- Report generation permissions through RBAC
- Site-specific access controls
- Role-based feature availability

### Data Sources
- Task data from SiteTasks state
- Approval data from approval workflow system
- Site information from SiteManagement
- User preferences and branding settings

## Troubleshooting

### Common Issues
1. **Missing Dependencies**: Ensure all required packages are installed
2. **Font Issues**: Arabic fonts may need custom loading
3. **Large Datasets**: Performance degradation with 1000+ tasks
4. **Browser Compatibility**: Modern browser required for blob URLs
5. **Memory Usage**: Large reports may cause memory issues

### Solutions
1. Install required packages: `npm install jspdf jspdf-autotable xlsx`
2. Load Arabic fonts separately or use system fonts
3. Implement pagination or data limiting for large datasets
4. Provide fallbacks for older browsers
5. Implement streaming or chunked processing for large reports

## Security Considerations

### Data Privacy
- All processing happens client-side
- No data transmitted to external servers
- Local storage for user preferences only
- Sensitive data protection in reports

### File Security
- Generated files contain no embedded scripts
- Safe download mechanisms
- Controlled access based on permissions
- Optional watermarking for sensitive content
