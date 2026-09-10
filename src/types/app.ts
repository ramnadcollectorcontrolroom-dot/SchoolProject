export type ViewName =
  | 'dashboard'
  | 'directory'
  | 'taluk'
  | 'village'
  | 'profile'
  | 'excel'
  | 'reports'
  | 'gaps'
  | 'quality'
  | 'settings'
  | 'collector'

export type AppUser = {
  username: string
  role: 'Admin' | 'Collector' | 'Officer'
  name: string
}

export type LoginFormState = {
  username: string
  password: string
  rememberDevice: boolean
}

export type ValidationIssue = {
  row: number
  field: string
  message: string
  severity: 'error' | 'warning'
}

export type ExcelImportSummary = {
  totalRows: number
  successfullyImported: number
  updatedRecords: number
  duplicateRecords: number
  invalidRecords: number
  missingMandatoryFields: number
}
