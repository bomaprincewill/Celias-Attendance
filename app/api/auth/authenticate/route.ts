import { NextResponse } from 'next/server'
import { consumeChallenge, verifyClientData } from '@/lib/webauthn'
import { getTeachers, getTeacherByCredential, clockIn } from '@/lib/store-supabase'

export async function POST(req: Request) {
  const { teacherId, credential } = await req.json()

  // Find teacher by credential ID
  const teacher = await getTeacherByCredential(credential.id) || (teacherId ? { id: teacherId, credentialId: credential.id } : null)

  if (!teacher) {
    return NextResponse.json({ error: 'Credential not registered' }, { status: 401 })
  }

  const challenge = consumeChallenge((teacher as any).id || teacherId)
  if (!challenge) {
    return NextResponse.json({ error: 'No active challenge' }, { status: 400 })
  }

  const valid = verifyClientData(credential.response.clientDataJSON, challenge, 'webauthn.get')
  if (!valid) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }

  const record = await clockIn((teacher as any).id, 'fingerprint')
  if (!record) {
    return NextResponse.json({ error: 'Already clocked in today' }, { status: 409 })
  }

  return NextResponse.json({ success: true, record })
}
