import { NextResponse } from 'next/server'
import { generateChallenge, storeChallenge } from '@/lib/webauthn'

export async function POST(req: Request) {
  const { teacherId } = await req.json()
  const key = teacherId || 'anonymous'
  const challenge = generateChallenge()
  storeChallenge(key, challenge)
  return NextResponse.json({ challenge })
}
