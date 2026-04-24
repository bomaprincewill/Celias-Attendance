import { NextResponse } from 'next/server'
import { consumeChallenge, verifyClientData } from '@/lib/webauthn'
import { getTeacher, updateTeacher } from '@/lib/store-supabase'

export async function POST(req: Request) {
  const { teacherId, credential } = await req.json()

  const teacher = await getTeacher(teacherId)
  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const challenge = consumeChallenge(teacherId)
  if (!challenge) {
    return NextResponse.json({ error: 'No active challenge. Request a new one.' }, { status: 400 })
  }

  const valid = verifyClientData(credential.response.clientDataJSON, challenge, 'webauthn.create')
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credential data' }, { status: 401 })
  }

  const updated = await updateTeacher(teacherId, {
    credentialId: credential.id,
    publicKey: credential.response.attestationObject,
    enrolledAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, teacher: updated })
}
