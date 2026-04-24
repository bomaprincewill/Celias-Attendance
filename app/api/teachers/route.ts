import { NextResponse } from 'next/server'
import { getTeachers, addTeacher, deleteTeacher } from '@/lib/store-supabase'
import { Teacher } from '@/lib/types'

export async function GET() {
  const teachers = await getTeachers()
  return NextResponse.json(teachers)
}

export async function POST(req: Request) {
  const body = await req.json()
  const name = body.name?.trim()
  const staffId = body.staffId?.trim()
  const subject = body.subject?.trim()
  const email = body.email?.trim()
  const phone = body.phone?.trim() || ''

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

  try {
    const newTeacher = await addTeacher(teacher)
    return NextResponse.json(newTeacher, { status: 201 })
  } catch (error: any) {
    const message = String(error?.message || '')
    const code = error?.code

    if (code === '23505' || message.toLowerCase().includes('duplicate')) {
      return NextResponse.json(
        { error: 'A teacher with that staff ID or email already exists' },
        { status: 409 }
      )
    }

    console.error('Error creating teacher:', error)
    return NextResponse.json(
      { error: 'Unable to create teacher right now. Please try again.' },
      { status: 500 }
    )
  }
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
