// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { calculateGenderPercentages, calculateFacilityAvailability, calculateStudentTeacherRatio } from './schoolUtils'

describe('schoolUtils', () => {
  it('calculates gender percentages safely', () => {
    expect(calculateGenderPercentages({ boys: 60, girls: 40, others: 10 })).toEqual({
      boysPercent: 60,
      girlsPercent: 40,
      totalStudents: 110,
    })
  })

  it('handles zero totals safely', () => {
    expect(calculateStudentTeacherRatio(0, 0)).toBe(0)
    expect(calculateStudentTeacherRatio(100, 0)).toBe(0)
  })

  it('calculates infrastructure availability with percentages', () => {
    expect(calculateFacilityAvailability({ available: 8, total: 12 })).toBe(66.67)
    expect(calculateFacilityAvailability({ available: 0, total: 0 })).toBe(0)
  })
})
