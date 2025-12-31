// Test date parsing logic
const testDate = '2025-11-23'

const parts = testDate.split('-')
const day = parts.length === 3 ? parseInt(parts[2], 10) : new Date(testDate).getDate()

console.log('Date:', testDate)
console.log('Parts:', parts)
console.log('Day:', day)

const weeks = [
  { id: 1, start: 1, end: 7 },
  { id: 2, start: 8, end: 14 },
  { id: 3, start: 15, end: 21 },
  { id: 4, start: 22, end: 28 },
  { id: 5, start: 29, end: 30 }
]

const weekIndex = weeks.findIndex(w => day >= w.start && day <= w.end)
console.log('Week Index:', weekIndex)
console.log('Week:', weeks[weekIndex])
