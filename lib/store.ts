/**
 * In-memory store (dev/demo).
 * Replace with a real DB (e.g. Prisma + SQLite/Postgres) for production.
 * All mutations go through the API routes so the store is the single source of truth.
 */
import { Teacher, AttendanceRecord } from './types'

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function ts(): string {
  return new Date().toISOString()
}

// Seed data
const seedTeachers: Teacher[] = [
  {
    id: 'T001',
    name: 'Mrs. Adaeze Okonkwo',
    staffId: 'STF-001',
    subject: 'Mathematics',
    email: 'a.okonkwo@school.edu',
    phone: '08012345678',
    credentialId: null,
    publicKey: null,
    enrolledAt: null,
  },
  {
    id: 'T002',
    name: 'Mr. Emeka Nwosu',
    staffId: 'STF-002',
    subject: 'English Language',
    email: 'e.nwosu@school.edu',
    phone: '08023456789',
    credentialId: null,
    publicKey: null,
    enrolledAt: null,
  },
  {
    id: 'T003',
    name: 'Miss Chioma Eze',
    staffId: 'STF-003',
    subject: 'Biology',
    email: 'c.eze@school.edu',
    phone: '08034567890',
    credentialId: null,
    publicKey: null,
    enrolledAt: null,
  },
  {
    id: 'T004',
    name: 'Mr. Bello Abdullahi',
    staffId: 'STF-004',
    subject: 'Physics',
    email: 'b.abdullahi@school.edu',
    phone: '08045678901',
    credentialId: null,
    publicKey: null,
    enrolledAt: null,
  },
  {
    id: 'T005',
    name: 'Mrs. Funke Adeyemi',
    staffId: 'STF-005',
    subject: 'Chemistry',
    email: 'f.adeyemi@school.edu',
    phone: '08056789012',
    credentialId: null,
    publicKey: null,
    enrolledAt: null,
  },
]

// Global mutable store (server singleton in Next.js dev)
declare global {
  // eslint-disable-next-line no-var
  var __store: {
    teachers: Teacher[]
    attendance: AttendanceRecord[]
  } | undefined
}

if (!global.__store) {
  global.__store = {
    teachers: seedTeachers,
    attendance: [],
  }
}

export const store = global.__store

// ── Teacher helpers ──────────────────────────────────────────────────────────
export function getTeachers(): Teacher[] {
  return store.teachers
}

export function getTeacher(id: string): Teacher | undefined {
  return store.teachers.find(t => t.id === id)
}

export function getTeacherByCredential(credentialId: string): Teacher | undefined {
  return store.teachers.find(t => t.credentialId === credentialId)
}

export function updateTeacher(id: string, patch: Partial<Teacher>): Teacher | null {
  const idx = store.teachers.findIndex(t => t.id === id)
  if (idx === -1) return null
  store.teachers[idx] = { ...store.teachers[idx], ...patch }
  return store.teachers[idx]
}

export function addTeacher(teacher: Teacher): Teacher {
  store.teachers.push(teacher)
  return teacher
}

export function deleteTeacher(id: string): boolean {
  const idx = store.teachers.findIndex(t => t.id === id)
  if (idx === -1) return false
  store.teachers.splice(idx, 1)
  // Also delete all attendance records for this teacher
  store.attendance = store.attendance.filter(r => r.teacherId !== id)
  return true
}

// ── Attendance helpers ───────────────────────────────────────────────────────
export function getAttendance(): AttendanceRecord[] {
  return store.attendance
}

export function getTodayAttendance(): AttendanceRecord[] {
  const t = today()
  return store.attendance.filter(r => r.date === t)
}

export function hasClockInToday(teacherId: string): boolean {
  const t = today()
  return store.attendance.some(r => r.teacherId === teacherId && r.date === t)
}

export function clockIn(teacherId: string, method: 'fingerprint' | 'pin' = 'fingerprint'): AttendanceRecord | null {
  if (hasClockInToday(teacherId)) return null
  const teacher = getTeacher(teacherId)
  if (!teacher) return null

  const record: AttendanceRecord = {
    id: `ATT-${Date.now()}`,
    teacherId,
    teacherName: teacher.name,
    staffId: teacher.staffId,
    subject: teacher.subject,
    clockInTime: ts(),
    date: today(),
    method,
  }
  store.attendance.push(record)
  return record
}
