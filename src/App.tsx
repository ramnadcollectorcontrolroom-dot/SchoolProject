import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  MapPinned,
  Menu,
  School,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  User,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import * as XLSX from 'xlsx'
import './App.css'
import { sampleSchools, type SchoolRecord } from './data/sampleSchools'
import SchoolMap from './components/SchoolMap'
import type { ExcelImportSummary, LoginFormState, ValidationIssue, ViewName } from './types/app'
import { calculateFacilityAvailability, calculateStudentTeacherRatio, moneyFormat } from './utils/schoolUtils'

const STORAGE_KEY = 'ramanathapuram-school-portal-data'
const AUTH_KEY = 'ramanathapuram-school-portal-auth'
const DEFAULT_PAGE: ViewName = 'dashboard'

const demoUsername = import.meta.env.VITE_DEMO_USERNAME || 'admin'
const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || 'admin123'
const approvedPortraitUrl = import.meta.env.VITE_APPROVED_CM_IMAGE || ''

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'directory', label: 'School Directory', icon: School },
  { id: 'taluk', label: 'Taluk / Block View', icon: MapPinned },
  { id: 'village', label: 'Village View', icon: Building2 },
  { id: 'profile', label: 'School Profile', icon: Users },
  { id: 'excel', label: 'Excel Import', icon: FileSpreadsheet },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'gaps', label: 'Infrastructure Gaps', icon: AlertTriangle },
  { id: 'quality', label: 'Data Quality', icon: Database },
  { id: 'collector', label: 'Collector Review', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

const facilityDefinitions = [
  { key: 'electricity', label: 'Electricity' },
  { key: 'drinkingWater', label: 'Drinking Water' },
  { key: 'boysToilet', label: 'Boys Toilet' },
  { key: 'girlsToilet', label: 'Girls Toilet' },
  { key: 'library', label: 'Library' },
  { key: 'laboratory', label: 'Laboratory' },
  { key: 'computerFacility', label: 'Computer' },
  { key: 'internet', label: 'Internet' },
  { key: 'smartClassroom', label: 'Smart Classroom' },
  { key: 'playground', label: 'Playground' },
  { key: 'boundaryWall', label: 'Boundary Wall' },
  { key: 'ramp', label: 'Ramp' },
] as const

const defaultLoginForm: LoginFormState = {
  username: '',
  password: '',
  rememberDevice: true,
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const saved = window.localStorage.getItem(AUTH_KEY)
    return saved === 'true'
  })
  const [activeView, setActiveView] = useState<ViewName>(DEFAULT_PAGE)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [schools, setSchools] = useState<SchoolRecord[]>(() => {
    if (typeof window === 'undefined') return sampleSchools
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) as SchoolRecord[] : sampleSchools
  })
  const [loginForm, setLoginForm] = useState<LoginFormState>(defaultLoginForm)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSchoolId, setSelectedSchoolId] = useState<number>(sampleSchools[0]?.id ?? 0)
  const [searchTerm, setSearchTerm] = useState('')
  const [talukFilter, setTalukFilter] = useState('All')
  const [blockFilter, setBlockFilter] = useState('All')
  const [villageFilter, setVillageFilter] = useState('All')
  const [managementFilter, setManagementFilter] = useState('All')
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [previewRows, setPreviewRows] = useState<Record<string, string | number | boolean | null>[]>([])
  const [importSummary, setImportSummary] = useState<ExcelImportSummary | null>(null)
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({})
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [villageViewTaluk, setVillageViewTaluk] = useState('All')

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schools))
  }, [schools])

  useEffect(() => {
    window.localStorage.setItem(AUTH_KEY, String(isLoggedIn))
  }, [isLoggedIn])

  const distinctTaluks = useMemo(() => ['All', ...new Set(schools.map((school) => school.taluk))], [schools])
  const distinctBlocks = useMemo(() => ['All', ...new Set(schools.filter((school) => talukFilter === 'All' || school.taluk === talukFilter).map((school) => school.block))], [schools, talukFilter])
  const distinctVillages = useMemo(() => ['All', ...new Set(schools.filter((school) => (talukFilter === 'All' || school.taluk === talukFilter) && (blockFilter === 'All' || school.block === blockFilter)).map((school) => school.village))], [schools, talukFilter, blockFilter])

  const schoolStats = useMemo(() => {
    const totalSchools = schools.length
    const governmentSchools = schools.filter((school) => school.management === 'Government').length
    const aidedSchools = schools.filter((school) => school.management === 'Government Aided').length
    const privateSchools = schools.filter((school) => school.management === 'Private').length
    const totalStudents = schools.reduce((sum, school) => sum + school.totalStudents, 0)
    const boys = schools.reduce((sum, school) => sum + school.boys, 0)
    const girls = schools.reduce((sum, school) => sum + school.girls, 0)
    const totalTeachers = schools.reduce((sum, school) => sum + school.totalTeachers, 0)
    const studentTeacherRatio = calculateStudentTeacherRatio(totalStudents, totalTeachers)

    return {
      totalSchools,
      governmentSchools,
      aidedSchools,
      privateSchools,
      totalStudents,
      boys,
      girls,
      totalTeachers,
      studentTeacherRatio,
    }
  }, [schools])

  const filteredSchools = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()

    return schools.filter((school) => {
      const matchesSearch = !query || [
        school.schoolName,
        school.udiseCode,
        school.village,
        school.block,
        school.taluk,
      ].some((value) => value.toLowerCase().includes(query))

      const matchesTaluk = talukFilter === 'All' || school.taluk === talukFilter
      const matchesBlock = blockFilter === 'All' || school.block === blockFilter
      const matchesVillage = villageFilter === 'All' || school.village === villageFilter
      const matchesManagement = managementFilter === 'All' || school.management === managementFilter

      return matchesSearch && matchesTaluk && matchesBlock && matchesVillage && matchesManagement
    })
  }, [schools, searchTerm, talukFilter, blockFilter, villageFilter, managementFilter])

  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? filteredSchools[0] ?? schools[0]

  const dashboardCardData = [
    { label: 'Total Schools', value: schoolStats.totalSchools, color: '#0f766e', icon: School },
    { label: 'Government Schools', value: schoolStats.governmentSchools, color: '#2563eb', icon: ShieldCheck },
    { label: 'Government Aided Schools', value: schoolStats.aidedSchools, color: '#0284c7', icon: GraduationCap },
    { label: 'Private Schools', value: schoolStats.privateSchools, color: '#f59e0b', icon: BookOpen },
    { label: 'Total Students', value: moneyFormat(schoolStats.totalStudents), color: '#0ea5e9', icon: Users },
    { label: 'Boys', value: moneyFormat(schoolStats.boys), color: '#1d4ed8', icon: User },
    { label: 'Girls', value: moneyFormat(schoolStats.girls), color: '#ec4899', icon: User },
    { label: 'Total Teachers', value: moneyFormat(schoolStats.totalTeachers), color: '#16a34a', icon: Users },
  ]

  const schoolsByTaluk = useMemo(() => {
    const entries = Object.entries(
      schools.reduce<Record<string, number>>((acc, school) => {
        acc[school.taluk] = (acc[school.taluk] ?? 0) + 1
        return acc
      }, {}),
    ).map(([name, value]) => ({ name, value }))

    return entries.sort((a, b) => b.value - a.value)
  }, [schools])

  const managementChart = useMemo(() => {
    const entries = ['Government', 'Government Aided', 'Private'].map((name) => ({
      name,
      value: schools.filter((school) => school.management === name).length,
    }))
    return entries
  }, [schools])

  const facilityGapData = useMemo(() => facilityDefinitions.map((facility) => {
    const available = schools.filter((school) => school[facility.key]).length
    return {
      name: facility.label,
      available,
      notAvailable: schools.length - available,
      percentage: calculateFacilityAvailability({ available, total: schools.length }),
    }
  }), [schools])

  const attentionRequired = useMemo(() => {
    const list: { title: string; schoolName: string; issue: string; level: 'High' | 'Medium' }[] = []

    schools.forEach((school) => {
      if (!school.drinkingWater) list.push({ title: 'School without drinking water', schoolName: school.schoolName, issue: 'Water facility missing', level: 'High' })
      if (!school.toilets) list.push({ title: 'School without toilet', schoolName: school.schoolName, issue: 'Toilet facility missing', level: 'High' })
      if (!school.electricity) list.push({ title: 'School without electricity', schoolName: school.schoolName, issue: 'Power infrastructure issue', level: 'High' })
      if (!school.boundaryWall) list.push({ title: 'School without boundary wall', schoolName: school.schoolName, issue: 'Security boundary missing', level: 'Medium' })
      if (!school.playground) list.push({ title: 'School without playground', schoolName: school.schoolName, issue: 'Playground unavailable', level: 'Medium' })
      if (!school.totalStudents) list.push({ title: 'Missing student data', schoolName: school.schoolName, issue: 'Student count absent', level: 'High' })
      if (!school.totalTeachers) list.push({ title: 'Missing teacher data', schoolName: school.schoolName, issue: 'Teacher count absent', level: 'High' })
      if (!school.headmaster) list.push({ title: 'Missing Headmaster information', schoolName: school.schoolName, issue: 'Administrative data incomplete', level: 'Medium' })
    })

    return list.slice(0, 12)
  }, [schools])

  const dataQualitySummary = useMemo(() => {
    const totalRecords = schools.length
    const errors: ValidationIssue[] = []
    const warnings: ValidationIssue[] = []
    const seen = new Map<string, number>()

    schools.forEach((school, index) => {
      if (!school.udiseCode) errors.push({ row: index + 1, field: 'udiseCode', message: 'Missing UDISE code', severity: 'error' })
      if (school.udiseCode && seen.has(school.udiseCode)) {
        errors.push({ row: index + 1, field: 'udiseCode', message: 'Duplicate UDISE code', severity: 'error' })
      }
      seen.set(school.udiseCode, (seen.get(school.udiseCode) ?? 0) + 1)

      if (!school.schoolName) errors.push({ row: index + 1, field: 'schoolName', message: 'Missing school name', severity: 'error' })
      if (!school.taluk) warnings.push({ row: index + 1, field: 'taluk', message: 'Missing Taluk', severity: 'warning' })
      if (!school.block) warnings.push({ row: index + 1, field: 'block', message: 'Missing Block', severity: 'warning' })
      if (!school.village) warnings.push({ row: index + 1, field: 'village', message: 'Missing Village', severity: 'warning' })
      if (!school.totalStudents) warnings.push({ row: index + 1, field: 'totalStudents', message: 'Missing student count', severity: 'warning' })
      if (!school.totalTeachers) warnings.push({ row: index + 1, field: 'totalTeachers', message: 'Missing teacher count', severity: 'warning' })
      if (school.totalStudents < 0 || school.boys < 0 || school.girls < 0) warnings.push({ row: index + 1, field: 'studentStats', message: 'Invalid numeric values', severity: 'warning' })
    })

    const validRecords = schools.filter((school) => !errors.some((issue) => issue.row === schools.indexOf(school) + 1) && !warnings.some((issue) => issue.row === schools.indexOf(school) + 1)).length

    return {
      totalRecords,
      validRecords,
      warnings: warnings.length,
      errors: errors.length,
      issues: [...errors, ...warnings],
      validRecordsRate: totalRecords ? Number(((validRecords / totalRecords) * 100).toFixed(2)) : 0,
    }
  }, [schools])

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setLoginError('')

    window.setTimeout(() => {
      const valid = loginForm.username.trim() === demoUsername && loginForm.password === demoPassword

      if (valid) {
        setIsLoggedIn(true)
        setActiveView('dashboard')
      } else {
        setLoginError('Invalid username or password. Please use the demo credentials from the environment settings.')
      }

      setIsLoading(false)
    }, 700)
  }

  const handleExportValidation = () => {
    const rows = [['Field', 'Row', 'Severity', 'Message']] as string[][]
    dataQualitySummary.issues.forEach((issue) => {
      rows.push([issue.field, String(issue.row), issue.severity, issue.message])
    })

    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'school-data-quality-report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      setImportFeedback({ type: 'error', message: 'Excel file format is not supported.' })
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const names = workbook.SheetNames
      setSheetNames(names)
      setSelectedSheet(names[0] || '')

      const firstSheet = workbook.Sheets[names[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number | boolean | null>>(firstSheet, {
        defval: '',
        raw: false,
      })

      const cleanedRows = rows.slice(0, 20).map((row) => ({ ...row }))
      setPreviewRows(cleanedRows)
      const autoMappings = buildAutoMappings(cleanedRows)
      setFieldMappings(autoMappings)
      setImportFeedback({ type: 'info', message: `Loaded ${cleanedRows.length} sample rows from ${names[0]}.` })
    } catch {
      setImportFeedback({ type: 'error', message: 'Unable to read Excel file. Please check the file and try again.' })
    }
  }

  const handleImport = () => {
    if (!previewRows.length) {
      setImportFeedback({ type: 'error', message: 'No preview data is available to import.' })
      return
    }

    const rowsToImport = previewRows
    const newRecords: SchoolRecord[] = []
    const duplicates: string[] = []
    const invalidRows: string[] = []
    const rowsWithIssues: ValidationIssue[] = []

    rowsToImport.forEach((row, index) => {
      const schoolName = String(row[fieldMappings.schoolName ?? Object.keys(row)[0]] ?? '').trim()
      const udiseCode = String(row[fieldMappings.udiseCode ?? 'udiseCode'] ?? '').trim()
      const schoolType = String(row[fieldMappings.schoolType ?? 'schoolType'] ?? 'High').trim() || 'High'
      const management = String(row[fieldMappings.management ?? 'management'] ?? 'Government').trim() || 'Government'
      const taluk = String(row[fieldMappings.taluk ?? 'taluk'] ?? '').trim()
      const block = String(row[fieldMappings.block ?? 'block'] ?? '').trim()
      const village = String(row[fieldMappings.village ?? 'village'] ?? '').trim()
      const totalStudents = Number(row[fieldMappings.totalStudents ?? 'totalStudents'] ?? 0)
      const totalTeachers = Number(row[fieldMappings.totalTeachers ?? 'totalTeachers'] ?? 0)

      if (!schoolName || !taluk || !block || !village || !udiseCode) {
        invalidRows.push(`Row ${index + 1}`)
        rowsWithIssues.push({ row: index + 1, field: 'schoolData', message: 'Missing mandatory fields', severity: 'error' })
        return
      }

      const existing = schools.find((school) => school.udiseCode === udiseCode)
      if (existing) {
        duplicates.push(udiseCode)
        const updated = {
          ...existing,
          schoolName,
          schoolType: schoolType as SchoolRecord['schoolType'],
          management: management as SchoolRecord['management'],
          taluk,
          block,
          village,
          latitude: parseOptionalNumber(row[fieldMappings.latitude ?? 'latitude']),
          longitude: parseOptionalNumber(row[fieldMappings.longitude ?? 'longitude']),
          phone: String(row[fieldMappings.phone ?? 'phone'] ?? '').trim(),
          email: String(row[fieldMappings.email ?? 'email'] ?? '').trim(),
          totalStudents,
          totalTeachers,
          lastUpdated: new Date().toISOString().slice(0, 10),
        }
        newRecords.push(updated)
        return
      }

      const nextRecord: SchoolRecord = {
        id: Math.max(0, ...schools.map((school) => school.id)) + newRecords.length + 1,
        schoolName,
        udiseCode,
        schoolType: schoolType as SchoolRecord['schoolType'],
        management: management as SchoolRecord['management'],
        taluk,
        block,
        village,
        establishedYear: Number(row[fieldMappings.establishedYear ?? 'establishedYear'] ?? 2000),
        headmaster: String(row[fieldMappings.headmaster ?? 'headmaster'] ?? 'Data Not Available'),
        address: String(row[fieldMappings.address ?? 'address'] ?? 'Data Not Available'),
        pinCode: String(row[fieldMappings.pinCode ?? 'pinCode'] ?? 'Data Not Available'),
        latitude: parseOptionalNumber(row[fieldMappings.latitude ?? 'latitude']),
        longitude: parseOptionalNumber(row[fieldMappings.longitude ?? 'longitude']),
        phone: String(row[fieldMappings.phone ?? 'phone'] ?? '').trim(),
        email: String(row[fieldMappings.email ?? 'email'] ?? '').trim(),
        totalStudents: Number.isFinite(totalStudents) ? totalStudents : 0,
        boys: Number(row[fieldMappings.boys ?? 'boys'] ?? 0),
        girls: Number(row[fieldMappings.girls ?? 'girls'] ?? 0),
        others: Number(row[fieldMappings.others ?? 'others'] ?? 0),
        totalTeachers: Number.isFinite(totalTeachers) ? totalTeachers : 0,
        nonTeachingStaff: Number(row[fieldMappings.nonTeachingStaff ?? 'nonTeachingStaff'] ?? 0),
        classes: String(row[fieldMappings.classes ?? 'classes'] ?? '').split(',').map((value) => value.trim()).filter(Boolean),
        medium: String(row[fieldMappings.medium ?? 'medium'] ?? 'Tamil'),
        subjects: String(row[fieldMappings.subjects ?? 'subjects'] ?? '').split(',').map((value) => value.trim()).filter(Boolean),
        building: 'Data Not Available',
        classrooms: Number(row[fieldMappings.classrooms ?? 'classrooms'] ?? 0),
        electricity: Boolean(row[fieldMappings.electricity ?? 'electricity'] ?? true),
        drinkingWater: Boolean(row[fieldMappings.drinkingWater ?? 'drinkingWater'] ?? true),
        toilets: Boolean(row[fieldMappings.toilets ?? 'toilets'] ?? true),
        girlsToilet: Boolean(row[fieldMappings.girlsToilet ?? 'girlsToilet'] ?? true),
        boysToilet: Boolean(row[fieldMappings.boysToilet ?? 'boysToilet'] ?? true),
        library: Boolean(row[fieldMappings.library ?? 'library'] ?? false),
        laboratory: Boolean(row[fieldMappings.laboratory ?? 'laboratory'] ?? false),
        computerFacility: Boolean(row[fieldMappings.computerFacility ?? 'computerFacility'] ?? false),
        internet: Boolean(row[fieldMappings.internet ?? 'internet'] ?? false),
        smartClassroom: Boolean(row[fieldMappings.smartClassroom ?? 'smartClassroom'] ?? false),
        playground: Boolean(row[fieldMappings.playground ?? 'playground'] ?? true),
        kitchen: Boolean(row[fieldMappings.kitchen ?? 'kitchen'] ?? false),
        boundaryWall: Boolean(row[fieldMappings.boundaryWall ?? 'boundaryWall'] ?? true),
        ramp: Boolean(row[fieldMappings.ramp ?? 'ramp'] ?? false),
        accessibility: Boolean(row[fieldMappings.accessibility ?? 'accessibility'] ?? false),
        status: 'Active',
        lastUpdated: new Date().toISOString().slice(0, 10),
      }
      newRecords.push(nextRecord)
    })

    const updatedSchools = [...schools.filter((school) => !newRecords.some((record) => record.udiseCode === school.udiseCode)), ...newRecords]
    setSchools(updatedSchools)

    const summary: ExcelImportSummary = {
      totalRows: rowsToImport.length,
      successfullyImported: newRecords.length,
      updatedRecords: duplicates.length,
      duplicateRecords: duplicates.length,
      invalidRecords: invalidRows.length,
      missingMandatoryFields: invalidRows.length,
    }

    setImportSummary(summary)
    setValidationIssues(rowsWithIssues)
    setImportFeedback({
      type: 'success',
      message: `Import complete: ${newRecords.length} records processed, ${invalidRows.length} invalid rows skipped.`,
    })
  }

  const resetFilters = () => {
    setSearchTerm('')
    setTalukFilter('All')
    setBlockFilter('All')
    setVillageFilter('All')
    setManagementFilter('All')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setLoginForm(defaultLoginForm)
    setActiveView(DEFAULT_PAGE)
  }

  const updateSelectedSchool = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    if (!selectedSchool) return
    const updatedSchool: SchoolRecord = {
      ...selectedSchool,
      schoolName: String(formData.get('schoolName') ?? '').trim(),
      headmaster: String(formData.get('headmaster') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      address: String(formData.get('address') ?? '').trim(),
      latitude: parseOptionalNumber(formData.get('latitude')),
      longitude: parseOptionalNumber(formData.get('longitude')),
      lastUpdated: new Date().toISOString().slice(0, 10),
    }
    setSchools((current) => current.map((school) => school.id === updatedSchool.id ? updatedSchool : school))
    setIsEditingProfile(false)
  }

  const exportSchools = (records: SchoolRecord[], filename: string) => {
    const rows = records.map((school) => ({
      School: school.schoolName,
      UDISE: school.udiseCode,
      Management: school.management,
      Type: school.schoolType,
      Taluk: school.taluk,
      Block: school.block,
      Village: school.village,
      Students: school.totalStudents,
      Teachers: school.totalTeachers,
      Latitude: school.latitude ?? '',
      Longitude: school.longitude ?? '',
    }))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Schools')
    XLSX.writeFile(workbook, filename)
  }

  if (!isLoggedIn) {
    return (
      <div className="login-page-shell">
        <div className="login-panel">
          <div className="login-branding">
            <div className="branding-topline">
              <div className="brand-mark">TN</div>
              <div>
                <p className="eyebrow">Government of Tamil Nadu</p>
                <span className="portal-label">District School Education</span>
              </div>
            </div>

            <div className="branding-copy">
              <p className="branding-kicker">Official monitoring portal</p>
              <h1>Ramanathapuram District</h1>
              <h2>School Information Portal</h2>
              <p className="tagline">Digital School Information &amp; Monitoring System</p>
              <p className="branding-description">A unified view of school records, student strength, infrastructure and location data for district-level review.</p>
            </div>

            <div className="branding-portrait" aria-label={approvedPortraitUrl ? 'Approved government portrait' : 'Approved government portrait placeholder'}>
              {approvedPortraitUrl ? (
                <img src={approvedPortraitUrl} alt="Approved government portrait" />
              ) : (
                <div className="portrait-placeholder">
                  <ShieldCheck size={24} />
                  <strong>Approved portrait asset</strong>
                  <span>Configure VITE_APPROVED_CM_IMAGE to display the supplied image.</span>
                </div>
              )}
            </div>

            <div className="feature-list">
              <div className="feature-item"><Database size={17} /><span>School Data Management</span></div>
              <div className="feature-item"><ShieldCheck size={17} /><span>District-level Monitoring</span></div>
              <div className="feature-item"><MapPinned size={17} /><span>Location &amp; Infrastructure Monitoring</span></div>
            </div>
          </div>

          <div className="login-form-card">
            <div className="login-header">
              <p className="form-kicker">Secure sign in</p>
              <h3>Welcome Back</h3>
              <p>Access Ramanathapuram District School Monitoring Portal</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <label>
                <span>Username / Mobile Number</span>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="Enter username or mobile number"
                />
              </label>

              <label>
                <span>Password</span>
                <div className="password-field">
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                  >
                    {isPasswordVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={loginForm.rememberDevice}
                  onChange={(event) => setLoginForm((current) => ({ ...current, rememberDevice: event.target.checked }))}
                />
                <span>Remember this device</span>
              </label>

              {loginError && <div className="error-banner">{loginError}</div>}

              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <button
              type="button"
              className="forgot-link"
              onClick={() => setLoginError('Please contact the district portal administrator to reset your password.')}
            >
              Forgot Password?
            </button>

            <div className="demo-box">
              <p>Demo Access</p>
              <span>Use the configured demo credentials for local review.</span>
              <span>Username: {demoUsername}</span>
              <span>Password: {demoPassword}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div>
            <div className="brand-chip">TN</div>
          </div>
          <div>
            <strong>School Portal</strong>
          </div>
        </div>

        <nav>
          {navigation.map((item) => {
            const Icon = item.icon
            const active = activeView === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => {
                  setActiveView(item.id as ViewName)
                  setSidebarOpen(false)
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="nav-item logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button type="button" className="menu-button" onClick={() => setSidebarOpen((current) => !current)}>
              <Menu size={18} />
            </button>
            <div>
              <p className="page-kicker">Ramanathapuram District</p>
              <h1>School Information Portal</h1>
            </div>
          </div>

          <div className="topbar-right">
            <div className="user-badge">
              <User size={16} />
              <span>{demoUsername}</span>
            </div>
          </div>
        </header>

        {activeView === 'dashboard' && (
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">District Overview</p>
                <h2>School Performance Dashboard</h2>
              </div>
            </div>

            <div className="stats-grid">
              {dashboardCardData.map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="stat-card" style={{ borderTopColor: color }}>
                  <div className="stat-icon" style={{ background: `${color}1a`, color }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p>{label}</p>
                    <strong>{value}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="chart-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Schools by Taluk</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={schoolsByTaluk}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>School Management</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={managementChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                      {managementChart.map((entry, index) => (
                        <Cell key={entry.name} fill={['#2563eb', '#0ea5e9', '#f59e0b'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="map-card">
              <div className="chart-header map-card-header">
                <div>
                  <p className="eyebrow">Location intelligence</p>
                  <h3>Ramanathapuram District – School Locations</h3>
                </div>
                <span className="location-count">{schools.filter((school) => Number.isFinite(school.latitude) && Number.isFinite(school.longitude)).length} mapped / {schools.length} schools</span>
              </div>
              <SchoolMap
                schools={schools}
                onSelectSchool={(school) => {
                  setSelectedSchoolId(school.id)
                  setActiveView('profile')
                }}
              />
              <div className="map-status-row">
                <span>Location Not Available: {schools.filter((school) => !Number.isFinite(school.latitude) || !Number.isFinite(school.longitude)).length}</span>
                <button type="button" className="text-link" onClick={() => setActiveView('directory')}>Update from School Profile</button>
              </div>
            </div>

            <div className="table-card">
              <div className="chart-header">
                <h3>Attention Required</h3>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>School</th>
                    <th>Note</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionRequired.length ? attentionRequired.map((item, index) => (
                    <tr key={`${item.title}-${index}`}>
                      <td>{item.title}</td>
                      <td>{item.schoolName}</td>
                      <td>{item.issue}</td>
                      <td><span className={`badge ${item.level === 'High' ? 'danger' : 'warning'}`}>{item.level}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4}>No urgent issues detected.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'directory' && (
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Directory</p>
                <h2>School Directory</h2>
              </div>
            </div>

            <div className="filter-panel">
              <div className="search-box">
                <Search size={16} />
                <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by school, UDISE, village, block or taluk" />
              </div>
              <select value={talukFilter} onChange={(event) => setTalukFilter(event.target.value)}>
                {distinctTaluks.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select value={blockFilter} onChange={(event) => setBlockFilter(event.target.value)}>
                {distinctBlocks.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select value={villageFilter} onChange={(event) => setVillageFilter(event.target.value)}>
                {distinctVillages.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select value={managementFilter} onChange={(event) => setManagementFilter(event.target.value)}>
                {['All', 'Government', 'Government Aided', 'Private'].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <button type="button" className="secondary-button" onClick={resetFilters}>Reset Filters</button>
            </div>

            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>School Name</th>
                    <th>UDISE Code</th>
                    <th>School Type</th>
                    <th>Management</th>
                    <th>Taluk</th>
                    <th>Block</th>
                    <th>Village</th>
                    <th>Students</th>
                    <th>Teachers</th>
                    <th>Status</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchools.length ? filteredSchools.map((school, index) => (
                    <tr key={school.id}>
                      <td>{index + 1}</td>
                      <td>{school.schoolName}</td>
                      <td>{school.udiseCode}</td>
                      <td>{school.schoolType}</td>
                      <td>{school.management}</td>
                      <td>{school.taluk}</td>
                      <td>{school.block}</td>
                      <td>{school.village}</td>
                      <td>{school.totalStudents}</td>
                      <td>{school.totalTeachers}</td>
                      <td><span className={`badge ${school.status === 'Active' ? 'success' : school.status === 'Needs Review' ? 'warning' : 'neutral'}`}>{school.status}</span></td>
                      <td>
                        <button type="button" className="text-link" onClick={() => { setSelectedSchoolId(school.id); setActiveView('profile') }}>View</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={12}>No schools found for the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'profile' && selectedSchool && (
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">School Profile</p>
                <h2>{selectedSchool.schoolName}</h2>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsEditingProfile((current) => !current)}>
                {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>

            {isEditingProfile && (
              <form className="edit-profile-form" onSubmit={updateSelectedSchool}>
                <label><span>School Name</span><input name="schoolName" defaultValue={selectedSchool.schoolName} required /></label>
                <label><span>Headmaster</span><input name="headmaster" defaultValue={selectedSchool.headmaster} /></label>
                <label><span>Phone</span><input name="phone" defaultValue={selectedSchool.phone ?? ''} /></label>
                <label><span>Email</span><input name="email" type="email" defaultValue={selectedSchool.email ?? ''} /></label>
                <label><span>Latitude</span><input name="latitude" type="number" step="any" defaultValue={selectedSchool.latitude ?? ''} /></label>
                <label><span>Longitude</span><input name="longitude" type="number" step="any" defaultValue={selectedSchool.longitude ?? ''} /></label>
                <label className="edit-wide"><span>Address</span><input name="address" defaultValue={selectedSchool.address} /></label>
                <button type="submit" className="primary-button edit-wide">Save Profile</button>
              </form>
            )}

            <div className="profile-grid">
              <div className="detail-panel">
                <h3>Basic Information</h3>
                <div className="detail-list">
                  <div><span>School Name</span><strong>{selectedSchool.schoolName}</strong></div>
                  <div><span>UDISE Code</span><strong>{selectedSchool.udiseCode}</strong></div>
                  <div><span>School Type</span><strong>{selectedSchool.schoolType}</strong></div>
                  <div><span>Management</span><strong>{selectedSchool.management}</strong></div>
                  <div><span>Established Year</span><strong>{selectedSchool.establishedYear || 'Data Not Available'}</strong></div>
                  <div><span>Address</span><strong>{selectedSchool.address || 'Data Not Available'}</strong></div>
                  <div><span>Village</span><strong>{selectedSchool.village}</strong></div>
                  <div><span>Block</span><strong>{selectedSchool.block}</strong></div>
                  <div><span>Taluk</span><strong>{selectedSchool.taluk}</strong></div>
                  <div><span>PIN Code</span><strong>{selectedSchool.pinCode || 'Data Not Available'}</strong></div>
                  <div><span>Location</span><strong>{selectedSchool.latitude !== undefined && selectedSchool.longitude !== undefined ? `${selectedSchool.latitude}, ${selectedSchool.longitude}` : 'Location Not Available'}</strong></div>
                </div>
              </div>

              <div className="detail-panel">
                <h3>Administration</h3>
                <div className="detail-list">
                  <div><span>Headmaster / Head Teacher</span><strong>{selectedSchool.headmaster || 'Data Not Available'}</strong></div>
                  <div><span>Number of Teachers</span><strong>{selectedSchool.totalTeachers}</strong></div>
                  <div><span>Non-Teaching Staff</span><strong>{selectedSchool.nonTeachingStaff}</strong></div>
                  <div><span>School Photo</span><strong>{selectedSchool.photo || 'Data Not Available'}</strong></div>
                  <div><span>Remarks</span><strong>{selectedSchool.remarks || 'Data Not Available'}</strong></div>
                  <div><span>Phone</span><strong>{selectedSchool.phone || 'Data Not Available'}</strong></div>
                  <div><span>Email</span><strong>{selectedSchool.email || 'Data Not Available'}</strong></div>
                  <div><span>Last Updated</span><strong>{selectedSchool.lastUpdated}</strong></div>
                </div>
              </div>

              <div className="detail-panel wide-panel">
                <h3>Student Information</h3>
                <div className="detail-list">
                  <div><span>Total Students</span><strong>{selectedSchool.totalStudents}</strong></div>
                  <div><span>Boys</span><strong>{selectedSchool.boys}</strong></div>
                  <div><span>Girls</span><strong>{selectedSchool.girls}</strong></div>
                  <div><span>Other Categories</span><strong>{selectedSchool.others}</strong></div>
                  <div><span>Class-wise Student Count</span><strong>{selectedSchool.classes.join(', ') || 'Data Not Available'}</strong></div>
                </div>
              </div>

              <div className="detail-panel wide-panel">
                <h3>Infrastructure</h3>
                <div className="facility-grid">
                  {facilityDefinitions.map((facility) => (
                    <div key={facility.key} className={`facility-pill ${selectedSchool[facility.key] ? 'yes' : 'no'}`}>
                      <span>{facility.label}</span>
                      <strong>{selectedSchool[facility.key] ? 'Available' : 'Not Available'}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-panel wide-panel">
                <h3>Academic Information</h3>
                <div className="detail-list">
                  <div><span>Classes Available</span><strong>{selectedSchool.classes.join(', ') || 'Data Not Available'}</strong></div>
                  <div><span>Medium of Instruction</span><strong>{selectedSchool.medium || 'Data Not Available'}</strong></div>
                  <div><span>Subjects</span><strong>{selectedSchool.subjects.join(', ') || 'Data Not Available'}</strong></div>
                  <div><span>Student Strength</span><strong>{selectedSchool.totalStudents}</strong></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeView === 'excel' && (
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Excel Import</p>
                <h2>Import School Data</h2>
              </div>
            </div>

            <div className="upload-box">
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
              <label className="upload-label"><Upload size={18} /> Select Excel file</label>
            </div>

            {importFeedback && <div className={`toast ${importFeedback.type}`}>{importFeedback.message}</div>}

            {sheetNames.length > 0 && (
              <div className="mapping-panel">
                <div className="sheet-selector">
                  <label>
                    <span>Available sheets</span>
                    <select value={selectedSheet} onChange={(event) => setSelectedSheet(event.target.value)}>
                      {sheetNames.map((sheet) => (
                        <option key={sheet} value={sheet}>{sheet}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="field-mapping">
                  {Object.entries(fieldMappings).length > 0 ? (
                    Object.entries(fieldMappings).map(([field, column]) => (
                      <label key={field}>
                        <span>{field}</span>
                        <select value={column} onChange={(event) => setFieldMappings((current) => ({ ...current, [field]: event.target.value }))}>
                          {previewRows.length ? Object.keys(previewRows[0]).map((header) => (
                            <option key={header} value={header}>{header}</option>
                          )) : null}
                        </select>
                      </label>
                    ))
                  ) : (
                    <p>No mapped fields were detected. Please upload a valid Excel sheet.</p>
                  )}
                </div>

                <button type="button" className="primary-button" onClick={handleImport}>Import Valid Records</button>
              </div>
            )}

            {previewRows.length > 0 && (
              <div className="table-card">
                <h3>Preview Data</h3>
                <table>
                  <thead>
                    <tr>
                      {Object.keys(previewRows[0]).slice(0, 8).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 5).map((row, index) => (
                      <tr key={`${index}-${row[Object.keys(row)[0]]}`}>
                        {Object.keys(row).slice(0, 8).map((key) => (
                          <td key={`${key}-${index}`}>{String(row[key] ?? 'Data Not Available')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {importSummary && (
              <div className="summary-grid">
                <div className="summary-card"><span>Total rows</span><strong>{importSummary.totalRows}</strong></div>
                <div className="summary-card"><span>Successfully imported</span><strong>{importSummary.successfullyImported}</strong></div>
                <div className="summary-card"><span>Updated records</span><strong>{importSummary.updatedRecords}</strong></div>
                <div className="summary-card"><span>Duplicate records</span><strong>{importSummary.duplicateRecords}</strong></div>
                <div className="summary-card"><span>Invalid records</span><strong>{importSummary.invalidRecords}</strong></div>
                <div className="summary-card"><span>Missing mandatory fields</span><strong>{importSummary.missingMandatoryFields}</strong></div>
              </div>
            )}

            {validationIssues.length > 0 && (
              <div className="table-card">
                <h3>Validation Report</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Field</th>
                      <th>Severity</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationIssues.map((issue, index) => (
                      <tr key={`${issue.field}-${issue.row}-${index}`}>
                        <td>{issue.row}</td>
                        <td>{issue.field}</td>
                        <td><span className={`badge ${issue.severity === 'error' ? 'danger' : 'warning'}`}>{issue.severity}</span></td>
                        <td>{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeView === 'gaps' && (
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Gap Analysis</p>
                <h2>Infrastructure Gap Analysis</h2>
              </div>
            </div>

            <div className="gap-grid">
              {facilityGapData.map((facility) => (
                <div key={facility.name} className="gap-card">
                  <div className="gap-header">
                    <h3>{facility.name}</h3>
                    <span>{facility.percentage}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: `${facility.percentage}%` }} />
                  </div>
                  <div className="gap-meta">
                    <p>Available: {facility.available}</p>
                    <p>Not Available: {facility.notAvailable}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeView === 'quality' && (
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Data Quality</p>
                <h2>Validation &amp; Correction Summary</h2>
              </div>
              <button type="button" className="secondary-button" onClick={handleExportValidation}>
                <Download size={16} /> Export CSV
              </button>
            </div>

            <div className="summary-grid quality-grid">
              <div className="summary-card"><span>Total Records</span><strong>{dataQualitySummary.totalRecords}</strong></div>
              <div className="summary-card"><span>Complete Records</span><strong>{dataQualitySummary.validRecordsRate}%</strong></div>
              <div className="summary-card"><span>Missing Headmaster</span><strong>{schools.filter((school) => !school.headmaster).length}</strong></div>
              <div className="summary-card"><span>Missing Student Data</span><strong>{schools.filter((school) => !school.totalStudents).length}</strong></div>
              <div className="summary-card"><span>Missing Teacher Data</span><strong>{schools.filter((school) => !school.totalTeachers).length}</strong></div>
              <div className="summary-card"><span>Missing GPS Location</span><strong>{schools.filter((school) => school.latitude === undefined || school.longitude === undefined).length}</strong></div>
              <div className="summary-card"><span>Missing Contact Details</span><strong>{schools.filter((school) => !school.phone && !school.email).length}</strong></div>
            </div>

            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Field</th>
                    <th>Severity</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {dataQualitySummary.issues.length ? dataQualitySummary.issues.map((issue, index) => (
                    <tr key={`${issue.field}-${issue.row}-${index}`}>
                      <td>{issue.row}</td>
                      <td>{issue.field}</td>
                      <td><span className={`badge ${issue.severity === 'error' ? 'danger' : 'warning'}`}>{issue.severity}</span></td>
                      <td>{issue.message}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4}>No data quality issues have been detected.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'reports' && (
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Reports</p>
                <h2>Printable District Summary</h2>
              </div>
              <button type="button" className="secondary-button" onClick={() => exportSchools(schools, 'ramanathapuram-school-report.xlsx')}>
                <Download size={16} /> Export Excel
              </button>
            </div>

            <div className="report-grid">
              <div className="report-card">
                <h3>District Summary</h3>
                <ul>
                  <li>Total Schools: {schoolStats.totalSchools}</li>
                  <li>Total Students: {moneyFormat(schoolStats.totalStudents)}</li>
                  <li>Total Teachers: {moneyFormat(schoolStats.totalTeachers)}</li>
                  <li>Government Schools: {schoolStats.governmentSchools}</li>
                </ul>
              </div>
              <div className="report-card">
                <h3>Taluk-wise Summary</h3>
                <ul>
                  {schoolsByTaluk.map((taluk) => (
                    <li key={taluk.name}>{taluk.name}: {taluk.value}</li>
                  ))}
                </ul>
              </div>
              <div className="report-card">
                <h3>Infrastructure Gap Report</h3>
                <ul>
                  {facilityGapData.slice(0, 6).map((facility) => (
                    <li key={facility.name}>{facility.name}: {facility.percentage}%</li>
                  ))}
                </ul>
              </div>
              <div className="report-card">
                <h3>Data Quality Report</h3>
                <ul>
                  <li>Missing GPS: {schools.filter((school) => school.latitude === undefined || school.longitude === undefined).length}</li>
                  <li>Missing Headmaster: {schools.filter((school) => !school.headmaster).length}</li>
                  <li>Missing Contact: {schools.filter((school) => !school.phone && !school.email).length}</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {activeView === 'taluk' && (
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Taluk View</p>
                <h2>Taluk / Block Analysis</h2>
              </div>
            </div>

            <div className="summary-grid">
              {schoolsByTaluk.map((taluk) => {
                const talukSchools = schools.filter((school) => school.taluk === taluk.name)
                return (
                  <div key={taluk.name} className="summary-card">
                    <span>{taluk.name}</span>
                    <strong>{taluk.value} schools</strong>
                    <p>{talukSchools.reduce((sum, school) => sum + school.totalStudents, 0)} students</p>
                  </div>
                )
              })}
            </div>

            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Taluk</th>
                    <th>Blocks</th>
                    <th>Schools</th>
                    <th>Gov / Aided / Private</th>
                    <th>Students</th>
                    <th>Teachers</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolsByTaluk.map((taluk) => {
                    const talukSchools = schools.filter((school) => school.taluk === taluk.name)
                    const blocks = [...new Set(talukSchools.map((school) => school.block))]
                    return (
                      <tr key={taluk.name} onClick={() => { setTalukFilter(taluk.name); setActiveView('directory') }} className="clickable-row">
                        <td><button type="button" className="text-link">{taluk.name}</button></td>
                        <td>{blocks.join(', ') || 'Data Not Available'}</td>
                        <td>{taluk.value}</td>
                        <td>{talukSchools.filter((school) => school.management === 'Government').length} / {talukSchools.filter((school) => school.management === 'Government Aided').length} / {talukSchools.filter((school) => school.management === 'Private').length}</td>
                        <td>{talukSchools.reduce((sum, school) => sum + school.totalStudents, 0)}</td>
                        <td>{talukSchools.reduce((sum, school) => sum + school.totalTeachers, 0)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'village' && (
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Village View</p>
                <h2>Village-wise School List</h2>
              </div>
            </div>

            <div className="table-card">
              <div className="filter-panel compact-filter">
                <select value={villageViewTaluk} onChange={(event) => setVillageViewTaluk(event.target.value)}>
                  {distinctTaluks.map((item) => <option key={item} value={item}>{item === 'All' ? 'All Taluks' : item}</option>)}
                </select>
                <select value={villageFilter} onChange={(event) => setVillageFilter(event.target.value)}>
                  <option value="All">All Villages</option>
                  {distinctVillages.filter((item) => item !== 'All').map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Village</th>
                    <th>Block</th>
                    <th>Taluk</th>
                    <th>Schools</th>
                    <th>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    schools.reduce<Record<string, { block: string; taluk: string; count: number; students: number }>>((acc, school) => {
                      const key = school.village
                      const current = acc[key] ?? { block: school.block, taluk: school.taluk, count: 0, students: 0 }
                      current.count += 1
                      current.students += school.totalStudents
                      acc[key] = current
                      return acc
                    }, {}),
                  ).filter(([village, data]) => (villageViewTaluk === 'All' || data.taluk === villageViewTaluk) && (villageFilter === 'All' || village === villageFilter)).map(([village, data]) => (
                    <tr key={village}>
                      <td>{village}</td>
                      <td>{data.block}</td>
                      <td>{data.taluk}</td>
                      <td>{data.count}</td>
                      <td>{data.students}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'settings' && (
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Settings</p>
                <h2>System Configuration</h2>
              </div>
            </div>

            <div className="settings-card">
              <div className="setting-row">
                <span>Portal Name</span>
                <strong>Ramanathapuram District School Information Portal</strong>
              </div>
              <div className="setting-row">
                <span>Demo User</span>
                <strong>{demoUsername}</strong>
              </div>
              <div className="setting-row">
                <span>Authentication Mode</span>
                <strong>Environment-based demo credentials</strong>
              </div>
              <div className="setting-row">
                <span>Data Storage</span>
                <strong>Local browser storage for offline development</strong>
              </div>
            </div>
          </section>
        )}

        {activeView === 'collector' && (
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Collector Review</p>
                <h2>Administrative Overview</h2>
              </div>
            </div>
            <div className="summary-grid">
              <div className="summary-card"><span>Total Schools</span><strong>{schoolStats.totalSchools}</strong></div>
              <div className="summary-card"><span>Total Students</span><strong>{moneyFormat(schoolStats.totalStudents)}</strong></div>
              <div className="summary-card"><span>Total Teachers</span><strong>{moneyFormat(schoolStats.totalTeachers)}</strong></div>
              <div className="summary-card"><span>Government Schools</span><strong>{schoolStats.governmentSchools}</strong></div>
              <div className="summary-card"><span>Infrastructure Gaps</span><strong>{attentionRequired.length}</strong></div>
              <div className="summary-card"><span>Data Pending Schools</span><strong>{schools.filter((school) => school.status === 'Data Pending').length}</strong></div>
              <div className="summary-card"><span>Highest School Taluk</span><strong>{schoolsByTaluk[0]?.name || 'No Data'}</strong></div>
              <div className="summary-card"><span>Lowest School Taluk</span><strong>{schoolsByTaluk[schoolsByTaluk.length - 1]?.name || 'No Data'}</strong></div>
              <div className="summary-card"><span>Schools without GPS</span><strong>{schools.filter((school) => school.latitude === undefined || school.longitude === undefined).length}</strong></div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function buildAutoMappings(rows: Record<string, string | number | boolean | null>[]) {
  const sample = rows[0] ?? {}
  const options = Object.keys(sample)
  const normalizedLookup = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const map = {
    schoolName: options.find((header) => ['schoolname', 'school', 'schoolnameenglish'].includes(normalizedLookup(header))) ?? options[0] ?? 'schoolName',
    udiseCode: options.find((header) => ['udisecode', 'udiseid', 'udise'].includes(normalizedLookup(header))) ?? 'udiseCode',
    schoolType: options.find((header) => ['schooltype', 'type'].includes(normalizedLookup(header))) ?? 'schoolType',
    management: options.find((header) => ['management', 'schoolmanagement'].includes(normalizedLookup(header))) ?? 'management',
    taluk: options.find((header) => ['taluk', 'talukname'].includes(normalizedLookup(header))) ?? 'taluk',
    block: options.find((header) => ['block', 'blockname'].includes(normalizedLookup(header))) ?? 'block',
    village: options.find((header) => ['village', 'villagename'].includes(normalizedLookup(header))) ?? 'village',
    totalStudents: options.find((header) => ['totalstudents', 'students', 'strength'].includes(normalizedLookup(header))) ?? 'totalStudents',
    totalTeachers: options.find((header) => ['totalteachers', 'teachers'].includes(normalizedLookup(header))) ?? 'totalTeachers',
    headmaster: options.find((header) => ['headmaster', 'headteacher', 'principal'].includes(normalizedLookup(header))) ?? 'headmaster',
    address: options.find((header) => ['address', 'location'].includes(normalizedLookup(header))) ?? 'address',
    pinCode: options.find((header) => ['pincode', 'pin', 'postalcode'].includes(normalizedLookup(header))) ?? 'pinCode',
  latitude: options.find((header) => ['latitude', 'lat'].includes(normalizedLookup(header))) ?? 'latitude',
  longitude: options.find((header) => ['longitude', 'lng', 'lon'].includes(normalizedLookup(header))) ?? 'longitude',
  phone: options.find((header) => ['phone', 'phonenumber', 'mobile'].includes(normalizedLookup(header))) ?? 'phone',
  email: options.find((header) => ['email', 'emailaddress'].includes(normalizedLookup(header))) ?? 'email',
    establishedYear: options.find((header) => ['establishedyear', 'yearofestablishment'].includes(normalizedLookup(header))) ?? 'establishedYear',
    boys: options.find((header) => ['boys', 'malestudents'].includes(normalizedLookup(header))) ?? 'boys',
    girls: options.find((header) => ['girls', 'femalestudents'].includes(normalizedLookup(header))) ?? 'girls',
    others: options.find((header) => ['others', 'otherstudents'].includes(normalizedLookup(header))) ?? 'others',
    nonTeachingStaff: options.find((header) => ['nonteachingstaff', 'supportstaff'].includes(normalizedLookup(header))) ?? 'nonTeachingStaff',
    classes: options.find((header) => ['classes', 'classavailable'].includes(normalizedLookup(header))) ?? 'classes',
    medium: options.find((header) => ['medium', 'mediumofinstruction'].includes(normalizedLookup(header))) ?? 'medium',
    subjects: options.find((header) => ['subjects', 'subject'].includes(normalizedLookup(header))) ?? 'subjects',
    classrooms: options.find((header) => ['classrooms', 'numberofclassrooms'].includes(normalizedLookup(header))) ?? 'classrooms',
    electricity: options.find((header) => ['electricity', 'elec'].includes(normalizedLookup(header))) ?? 'electricity',
    drinkingWater: options.find((header) => ['drinkingwater', 'waterfacility'].includes(normalizedLookup(header))) ?? 'drinkingWater',
    toilets: options.find((header) => ['toilets', 'sanitation'].includes(normalizedLookup(header))) ?? 'toilets',
    girlsToilet: options.find((header) => ['girlstoilet', 'girltoliet'].includes(normalizedLookup(header))) ?? 'girlsToilet',
    boysToilet: options.find((header) => ['boystoilet', 'boystoliet'].includes(normalizedLookup(header))) ?? 'boysToilet',
    library: options.find((header) => ['library'].includes(normalizedLookup(header))) ?? 'library',
    laboratory: options.find((header) => ['laboratory', 'lab'].includes(normalizedLookup(header))) ?? 'laboratory',
    computerFacility: options.find((header) => ['computerfacility', 'computerlab'].includes(normalizedLookup(header))) ?? 'computerFacility',
    internet: options.find((header) => ['internet', 'wifi'].includes(normalizedLookup(header))) ?? 'internet',
    smartClassroom: options.find((header) => ['smartclassroom'].includes(normalizedLookup(header))) ?? 'smartClassroom',
    playground: options.find((header) => ['playground'].includes(normalizedLookup(header))) ?? 'playground',
    kitchen: options.find((header) => ['kitchen', 'middaymeal'].includes(normalizedLookup(header))) ?? 'kitchen',
    boundaryWall: options.find((header) => ['boundarywall', 'compoundwall'].includes(normalizedLookup(header))) ?? 'boundaryWall',
    ramp: options.find((header) => ['ramp'].includes(normalizedLookup(header))) ?? 'ramp',
    accessibility: options.find((header) => ['accessibility', 'handicap'].includes(normalizedLookup(header))) ?? 'accessibility',
  }

  return Object.fromEntries(
    Object.entries(map).filter(([, value]) => Boolean(value)) as [string, string][],
  )
}

export default App

function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
