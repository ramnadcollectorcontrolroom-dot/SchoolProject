export type SchoolRecord = {
  id: number
  schoolName: string
  udiseCode: string
  schoolType: 'Primary' | 'Middle' | 'High' | 'Higher Secondary'
  management: 'Government' | 'Government Aided' | 'Private'
  taluk: string
  block: string
  village: string
  establishedYear: number
  headmaster: string
  address: string
  pinCode: string
  totalStudents: number
  boys: number
  girls: number
  others: number
  totalTeachers: number
  nonTeachingStaff: number
  classes: string[]
  medium: string
  subjects: string[]
  building: string
  classrooms: number
  electricity: boolean
  drinkingWater: boolean
  toilets: boolean
  girlsToilet: boolean
  boysToilet: boolean
  library: boolean
  laboratory: boolean
  computerFacility: boolean
  internet: boolean
  smartClassroom: boolean
  playground: boolean
  kitchen: boolean
  boundaryWall: boolean
  ramp: boolean
  accessibility: boolean
  status: 'Active' | 'Needs Review' | 'Data Pending'
  lastUpdated: string
  photo?: string
  remarks?: string
}

export const sampleSchools: SchoolRecord[] = [
  {
    id: 1,
    schoolName: 'Government Higher Secondary School, Ramanathapuram',
    udiseCode: '33260100101',
    schoolType: 'Higher Secondary',
    management: 'Government',
    taluk: 'Ramanathapuram',
    block: 'Ramanathapuram',
    village: 'Ramanathapuram',
    establishedYear: 1956,
    headmaster: 'R. Ganesan',
    address: 'Main Road, Ramanathapuram',
    pinCode: '623501',
    totalStudents: 810,
    boys: 420,
    girls: 360,
    others: 30,
    totalTeachers: 32,
    nonTeachingStaff: 7,
    classes: ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'],
    medium: 'Tamil',
    subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'],
    building: 'Permanent',
    classrooms: 24,
    electricity: true,
    drinkingWater: true,
    toilets: true,
    girlsToilet: true,
    boysToilet: true,
    library: true,
    laboratory: true,
    computerFacility: true,
    internet: true,
    smartClassroom: true,
    playground: true,
    kitchen: false,
    boundaryWall: true,
    ramp: true,
    accessibility: true,
    status: 'Active',
    lastUpdated: '2026-08-12',
    remarks: 'Infrastructure mostly compliant.',
  },
  {
    id: 2,
    schoolName: 'Government Girls Higher Secondary School',
    udiseCode: '33260100202',
    schoolType: 'Higher Secondary',
    management: 'Government',
    taluk: 'Ramanathapuram',
    block: 'Ramanathapuram',
    village: 'Nallur',
    establishedYear: 1978,
    headmaster: 'P. Selvi',
    address: 'Nallur Road, Ramanathapuram',
    pinCode: '623503',
    totalStudents: 640,
    boys: 0,
    girls: 620,
    others: 20,
    totalTeachers: 28,
    nonTeachingStaff: 5,
    classes: ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'],
    medium: 'Tamil',
    subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Commerce'],
    building: 'Permanent',
    classrooms: 20,
    electricity: true,
    drinkingWater: true,
    toilets: true,
    girlsToilet: true,
    boysToilet: false,
    library: true,
    laboratory: true,
    computerFacility: true,
    internet: false,
    smartClassroom: false,
    playground: true,
    kitchen: false,
    boundaryWall: true,
    ramp: true,
    accessibility: true,
    status: 'Needs Review',
    lastUpdated: '2026-08-15',
    remarks: 'Boys toilet facility missing.',
  },
  {
    id: 3,
    schoolName: 'Aided Middle School, Paramakudi',
    udiseCode: '33260200303',
    schoolType: 'Middle',
    management: 'Government Aided',
    taluk: 'Paramakudi',
    block: 'Paramakudi',
    village: 'Paramakudi',
    establishedYear: 1965,
    headmaster: 'K. Muthukumar',
    address: 'Paramakudi Town',
    pinCode: '623707',
    totalStudents: 290,
    boys: 150,
    girls: 130,
    others: 10,
    totalTeachers: 14,
    nonTeachingStaff: 3,
    classes: ['VI', 'VII', 'VIII'],
    medium: 'Tamil',
    subjects: ['Tamil', 'English', 'Maths', 'Science'],
    building: 'Permanent',
    classrooms: 12,
    electricity: true,
    drinkingWater: false,
    toilets: true,
    girlsToilet: true,
    boysToilet: true,
    library: false,
    laboratory: false,
    computerFacility: false,
    internet: false,
    smartClassroom: false,
    playground: true,
    kitchen: false,
    boundaryWall: true,
    ramp: false,
    accessibility: false,
    status: 'Data Pending',
    lastUpdated: '2026-08-18',
    remarks: 'Drinking water and ramp are missing.',
  },
  {
    id: 4,
    schoolName: 'St. Joseph Primary School',
    udiseCode: '33260300404',
    schoolType: 'Primary',
    management: 'Private',
    taluk: 'Thiruvadanai',
    block: 'Thiruvadanai',
    village: 'Kariyapatti',
    establishedYear: 1992,
    headmaster: 'S. Joseph',
    address: 'Kariyapatti Main Road',
    pinCode: '623407',
    totalStudents: 180,
    boys: 85,
    girls: 90,
    others: 5,
    totalTeachers: 10,
    nonTeachingStaff: 2,
    classes: ['I', 'II', 'III', 'IV', 'V'],
    medium: 'English',
    subjects: ['Tamil', 'English', 'Mathematics', 'EVS'],
    building: 'Permanent',
    classrooms: 9,
    electricity: true,
    drinkingWater: true,
    toilets: true,
    girlsToilet: true,
    boysToilet: true,
    library: true,
    laboratory: false,
    computerFacility: true,
    internet: true,
    smartClassroom: true,
    playground: true,
    kitchen: true,
    boundaryWall: true,
    ramp: true,
    accessibility: true,
    status: 'Active',
    lastUpdated: '2026-08-20',
  },
  {
    id: 5,
    schoolName: 'Muthiah Government High School',
    udiseCode: '33260400505',
    schoolType: 'High',
    management: 'Government',
    taluk: 'Kamuthi',
    block: 'Kamuthi',
    village: 'Kallankurichi',
    establishedYear: 1984,
    headmaster: 'N. Arumugam',
    address: 'Kallankurichi Road',
    pinCode: '623603',
    totalStudents: 510,
    boys: 260,
    girls: 240,
    others: 10,
    totalTeachers: 23,
    nonTeachingStaff: 4,
    classes: ['VI', 'VII', 'VIII', 'IX', 'X'],
    medium: 'Tamil',
    subjects: ['Tamil', 'English', 'Maths', 'Science', 'Social Science'],
    building: 'Rented',
    classrooms: 11,
    electricity: false,
    drinkingWater: false,
    toilets: false,
    girlsToilet: false,
    boysToilet: false,
    library: true,
    laboratory: false,
    computerFacility: false,
    internet: false,
    smartClassroom: false,
    playground: true,
    kitchen: false,
    boundaryWall: false,
    ramp: false,
    accessibility: false,
    status: 'Needs Review',
    lastUpdated: '2026-08-05',
    remarks: 'Multiple infrastructure gaps identified.',
  },
]

export const districtSummary = {
  districtName: 'Ramanathapuram District',
  taluks: ['Ramanathapuram', 'Paramakudi', 'Thiruvadanai', 'Kamuthi'],
  blocks: ['Ramanathapuram', 'Paramakudi', 'Thiruvadanai', 'Kamuthi'],
}
