export type GenderCounts = {
  boys: number
  girls: number
  others?: number
}

export function calculateGenderPercentages({ boys, girls, others = 0 }: GenderCounts) {
  const totalStudents = boys + girls + others
  const genderBase = boys + girls

  const boysPercent = genderBase > 0 ? Number(((boys / genderBase) * 100).toFixed(2)) : 0
  const girlsPercent = genderBase > 0 ? Number(((girls / genderBase) * 100).toFixed(2)) : 0

  return {
    boysPercent,
    girlsPercent,
    totalStudents,
  }
}

export function calculateStudentTeacherRatio(totalStudents: number, totalTeachers: number) {
  if (!totalStudents || !totalTeachers) return 0
  return Number((totalStudents / totalTeachers).toFixed(2))
}

export function calculateFacilityAvailability({ available, total }: { available: number; total: number }) {
  if (!total) return 0
  return Number(((available / total) * 100).toFixed(2))
}

export function moneyFormat(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}
