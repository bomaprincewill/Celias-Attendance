import { NextResponse } from 'next/server'
import { getTeachers, addTeacher, deleteTeacher } from '@/lib/store-supabase'
import { Teacher } from '@/lib/types'

export async function GET() {
  const teachers = await getTeachers()
  return NextResponse.json(teachers)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, staffId, subject, email, phone } = body

  if (!name || !staffId || !subject || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const teacher: Teacher = {
    id: `T${Date.now()}`,
    name,
    staffId,
    subject,
    email,
    phone: phone || '',
    credentialId: null,
    publicKey: null,
    enrolledAt: null,
  }

  const newTeacher = await addTeacher(teacher)
  return NextResponse.json(newTeacher, { status: 201 })
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 })
  }

  const success = await deleteTeacher(id)
  if (!success) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
