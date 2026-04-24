/**
 * Supabase store adapter
 * Replaces the in-memory store with Supabase PostgreSQL database
 * API remains the same for seamless integration with existing code
 */
import { Teacher, AttendanceRecord } from './types'
import { getSupabase } from './supabase'

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function ts(): string {
  return new Date().toISOString()
}

// ── Teacher helpers ──────────────────────────────────────────────────────────
export async function getTeachers(): Promise<Teacher[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching teachers:', error)
    return []
  }

  return (data || []).map(t => ({
    id: t.id,
    name: t.name,
    staffId: t.staff_id,
    subject: t.subject,
    email: t.email,
    phone: t.phone || '',
    credentialId: t.credential_id,
    publicKey: t.public_key,
    enrolledAt: t.enrolled_at,
  }))
}

export async function getTeacher(id: string): Promise<Teacher | undefined> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return undefined

  return {
    id: data.id,
    name: data.name,
    staffId: data.staff_id,
    subject: data.subject,
    email: data.email,
    phone: data.phone || '',
    credentialId: data.credential_id,
    publicKey: data.public_key,
    enrolledAt: data.enrolled_at,
  }
}

export async function getTeacherByCredential(credentialId: string): Promise<Teacher | undefined> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('credential_id', credentialId)
    .single()

  if (error || !data) return undefined

  return {
    id: data.id,
    name: data.name,
    staffId: data.staff_id,
    subject: data.subject,
    email: data.email,
    phone: data.phone || '',
    credentialId: data.credential_id,
    publicKey: data.public_key,
    enrolledAt: data.enrolled_at,
  }
}

export async function updateTeacher(id: string, patch: Partial<Teacher>): Promise<Teacher | null> {
  const supabase = getSupabase()
  const updateData: Record<string, any> = {}

  if (patch.name) updateData.name = patch.name
  if (patch.staffId) updateData.staff_id = patch.staffId
  if (patch.subject) updateData.subject = patch.subject
  if (patch.email) updateData.email = patch.email
  if (patch.phone) updateData.phone = patch.phone
  if (patch.credentialId) updateData.credential_id = patch.credentialId
  if (patch.publicKey) updateData.public_key = patch.publicKey
  if (patch.enrolledAt) updateData.enrolled_at = patch.enrolledAt
  updateData.updated_at = ts()

  const { data, error } = await supabase
    .from('teachers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    name: data.name,
    staffId: data.staff_id,
    subject: data.subject,
    email: data.email,
    phone: data.phone || '',
    credentialId: data.credential_id,
    publicKey: data.public_key,
    enrolledAt: data.enrolled_at,
  }
}

export async function addTeacher(teacher: Teacher): Promise<Teacher> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('teachers')
    .insert([
      {
        id: teacher.id,
        name: teacher.name,
        staff_id: teacher.staffId,
        subject: teacher.subject,
        email: teacher.email,
        phone: teacher.phone || null,
        credential_id: null,
        public_key: null,
        enrolled_at: null,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error adding teacher:', error)
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    staffId: data.staff_id,
    subject: data.subject,
    email: data.email,
    phone: data.phone || '',
    credentialId: data.credential_id,
    publicKey: data.public_key,
    enrolledAt: data.enrolled_at,
  }
}

export async function deleteTeacher(id: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', id)

  // Also delete related attendance records (Supabase cascade delete should handle this,
  // but we can be explicit)
  await supabase
    .from('attendance_records')
    .delete()
    .eq('teacher_id', id)

  return !error
}

// ── Attendance helpers ───────────────────────────────────────────────────────
export async function getAttendance(): Promise<AttendanceRecord[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .order('clock_in_time', { ascending: false })

  if (error) {
    console.error('Error fetching attendance:', error)
    return []
  }

  return (data || []).map(r => ({
    id: r.id,
    teacherId: r.teacher_id,
    teacherName: r.teacher_name,
    staffId: r.staff_id,
    subject: r.subject,
    clockInTime: r.clock_in_time,
    date: r.date,
    method: r.method as 'fingerprint' | 'pin',
  }))
}

export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
  const supabase = getSupabase()
  const t = today()
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('date', t)
    .order('clock_in_time', { ascending: false })

  if (error) {
    console.error('Error fetching today attendance:', error)
    return []
  }

  return (data || []).map(r => ({
    id: r.id,
    teacherId: r.teacher_id,
    teacherName: r.teacher_name,
    staffId: r.staff_id,
    subject: r.subject,
    clockInTime: r.clock_in_time,
    date: r.date,
    method: r.method as 'fingerprint' | 'pin',
  }))
}

export async function hasClockInToday(teacherId: string): Promise<boolean> {
  const supabase = getSupabase()
  const t = today()
  const { data, error } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('date', t)
    .single()

  return !error && !!data
}

export async function clockIn(teacherId: string, method: 'fingerprint' | 'pin' = 'fingerprint'): Promise<AttendanceRecord | null> {
  const supabase = getSupabase()
  // Check if already clocked in today
  const alreadyClocked = await hasClockInToday(teacherId)
  if (alreadyClocked) return null

  const teacher = await getTeacher(teacherId)
  if (!teacher) return null

  const record = {
    id: `ATT-${Date.now()}`,
    teacher_id: teacherId,
    teacher_name: teacher.name,
    staff_id: teacher.staffId,
    subject: teacher.subject,
    clock_in_time: ts(),
    date: today(),
    method,
  }

  const { data, error } = await supabase
    .from('attendance_records')
    .insert([record])
    .select()
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    teacherId: data.teacher_id,
    teacherName: data.teacher_name,
    staffId: data.staff_id,
    subject: data.subject,
    clockInTime: data.clock_in_time,
    date: data.date,
    method: data.method as 'fingerprint' | 'pin',
  }
}
