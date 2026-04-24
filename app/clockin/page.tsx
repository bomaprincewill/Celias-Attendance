'use client'

import { useState, useEffect } from 'react'
import FingerprintScanner from '@/components/FingerprintScanner'
import { Teacher } from '@/lib/types'
import { CheckCircle, XCircle, ChevronDown, Fingerprint, KeyRound } from 'lucide-react'

type Phase = 'idle' | 'scanning' | 'success' | 'error'
type Method = 'fingerprint' | 'pin'

export default function ClockInPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const [record, setRecord] = useState<any>(null)
  const [method, setMethod] = useState<Method>('fingerprint')
  const [pin, setPin] = useState('')

  useEffect(() => {
    fetch('/api/teachers').then(r => r.json()).then(setTeachers)
  }, [])

  const selected = teachers.find(t => t.id === selectedId)

  async function handleFingerprint() {
    if (!selected) return setMessage('Please select a teacher first')
    if (!selected.credentialId) return setMessage('This teacher has no enrolled fingerprint. Please register first.')

    setPhase('scanning')
    setMessage('Place your finger on the sensor...')

    try {
      // 1. Get challenge
      const challengeRes = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: selectedId }),
      })
      const { challenge } = await challengeRes.json()

      // 2. Browser WebAuthn assertion
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: base64urlToBuffer(challenge),
          allowCredentials: [{
            id: base64urlToBuffer(selected.credentialId!),
            type: 'public-key',
          }],
          userVerification: 'preferred',
          timeout: 30000,
        },
      }) as PublicKeyCredential

      const authRes = assertion.response as AuthenticatorAssertionResponse

      // 3. Verify on server & clock in
      const res = await fetch('/api/auth/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: selectedId,
          credential: {
            id: assertion.id,
            response: {
              clientDataJSON: bufferToBase64url(authRes.clientDataJSON),
              authenticatorData: bufferToBase64url(authRes.authenticatorData),
              signature: bufferToBase64url(authRes.signature),
            },
          },
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setPhase('success')
        setRecord(data.record)
        setMessage(`Welcome, ${selected.name}! Clock-in recorded.`)
      } else {
        setPhase('error')
        setMessage(data.error || 'Authentication failed')
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setPhase('error')
        setMessage('Fingerprint scan cancelled or not allowed.')
      } else {
        setPhase('error')
        setMessage('Biometric authentication failed. Try PIN method.')
      }
    }
  }

  async function handlePinClockIn() {
    if (!selected) return setMessage('Please select a teacher first')
    if (pin !== '1234') { // Demo PIN — replace with real auth
      setPhase('error')
      setMessage('Incorrect PIN. Demo PIN is 1234.')
      setTimeout(() => { setPhase('idle'); setMessage('') }, 2000)
      return
    }

    setPhase('scanning')
    setMessage('Verifying...')

    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: selectedId, method: 'pin' }),
    })
    const data = await res.json()

    if (res.ok) {
      setPhase('success')
      setRecord(data)
      setMessage(`Welcome, ${selected.name}! Clock-in recorded via PIN.`)
    } else {
      setPhase('error')
      setMessage(data.error || 'Clock-in failed')
    }
  }

  function reset() {
    setPhase('idle')
    setMessage('')
    setRecord(null)
    setPin('')
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Teacher Clock-In</h1>
        <p className="text-slate-500 mt-2">Use your fingerprint or PIN to mark attendance</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Method toggle */}
        <div className="flex border-b border-slate-100">
          {(['fingerprint', 'pin'] as Method[]).map(m => (
            <button
              key={m}
              onClick={() => { setMethod(m); reset() }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors
                ${method === m ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {m === 'fingerprint' ? <Fingerprint size={16} /> : <KeyRound size={16} />}
              {m === 'fingerprint' ? 'Fingerprint' : 'PIN'}
            </button>
          ))}
        </div>

        <div className="p-8 space-y-6">
          {/* Teacher select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Teacher</label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={e => { setSelectedId(e.target.value); reset() }}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                           text-slate-800 pr-10 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
              >
                <option value="">— Choose a teacher —</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.staffId})
                    {t.credentialId ? ' ✓ Enrolled' : ' — Not enrolled'}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Scanner / PIN input */}
          {method === 'fingerprint' ? (
            <div className="flex flex-col items-center gap-5 py-4">
              <FingerprintScanner phase={phase} size={140} />
              <p className={`text-sm font-medium text-center min-h-5
                ${phase === 'success' ? 'text-emerald-600' :
                  phase === 'error'   ? 'text-red-500' :
                  phase === 'scanning'? 'text-green-600' :
                                        'text-slate-400'}`}>
                {message || 'Ready to scan'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <label className="block text-sm font-medium text-slate-700">Enter PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center
                           text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              {message && (
                <p className={`text-sm text-center ${phase === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
                  {message}
                </p>
              )}
              <p className="text-xs text-slate-400 text-center">Demo PIN: 1234</p>
            </div>
          )}

          {/* Success record */}
          {phase === 'success' && record && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-2 animate-fade-up">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle size={18} />
                Attendance Recorded
              </div>
              <div className="text-sm text-emerald-600 space-y-1">
                <p><span className="font-medium">Time:</span> {new Date(record.clockInTime).toLocaleTimeString()}</p>
                <p><span className="font-medium">Date:</span> {new Date(record.clockInTime).toLocaleDateString()}</p>
                <p><span className="font-medium">Method:</span> {record.method === 'fingerprint' ? '🔏 Fingerprint' : '🔑 PIN'}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {phase !== 'success' ? (
              <button
                onClick={method === 'fingerprint' ? handleFingerprint : handlePinClockIn}
                disabled={!selectedId || phase === 'scanning'}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400
                           text-white font-semibold py-3.5 rounded-xl transition-all active:scale-95"
              >
                {phase === 'scanning' ? 'Verifying...' : method === 'fingerprint' ? 'Scan Fingerprint' : 'Verify PIN'}
              </button>
            ) : (
              <button onClick={reset}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl transition-all">
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// WebAuthn helpers
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(base64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bin = String.fromCharCode(...Array.from(new Uint8Array(buffer)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
