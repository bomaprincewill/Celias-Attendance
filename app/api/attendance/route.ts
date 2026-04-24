import { NextResponse } from 'next/server'
import { getAttendance, getTodayAttendance, clockIn } from '@/lib/store-supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter')
  const records = filter === 'today' ? await getTodayAttendance() : await getAttendance()
  return NextResponse.json(records)
}

export async function POST(req: Request) {
  const { teacherId, method } = await req.json()
  if (!teacherId) {
    return NextResponse.json({ error: 'teacherId required' }, { status: 400 })
  }
  const record = await clockIn(teacherId, method || 'fingerprint')
  if (!record) {
    return NextResponse.json({ error: 'Already clocked in today or teacher not found' }, { status: 409 })
  }
  return NextResponse.json(record, { status: 201 })
}
