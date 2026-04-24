export interface Teacher {
  id: string
  name: string
  staffId: string
  subject: string
  email: string
  phone: string
  credentialId: string | null   // WebAuthn credential ID (base64url)
  publicKey: string | null      // Stored public key data
  enrolledAt: string | null
  avatar?: string
}

export interface AttendanceRecord {
  id: string
  teacherId: string
  teacherName: string
  staffId: string
  subject: string
  clockInTime: string           // ISO string
  date: string                  // YYYY-MM-DD
  method: 'fingerprint' | 'pin'
}

export interface DailyStats {
  date: string
  present: number
  total: number
  percentage: number
}
