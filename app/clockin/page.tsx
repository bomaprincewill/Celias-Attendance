'use client'

import { useState, useEffect } from 'react'
import FingerprintScanner from '@/components/FingerprintScanner'
import { Teacher } from '@/lib/types'
import { CheckCircle, ChevronDown, Fingerprint, KeyRound } from 'lucide-react'

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
      const challengeRes = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: selectedId }),
      })
      const { challenge } = await challengeRes.json()

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
    if (pin !== '1234') {
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
    <div className="mx-auto max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Teacher Clock-In</h1>
        <p className="mt-2 text-slate-500">Use your fingerprint or PIN to mark attendance</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-100">
          {(['fingerprint', 'pin'] as Method[]).map(m => (
            <button
              key={m}
              onClick={() => { setMethod(m); reset() }}
              className={`flex-1 px-3 py-4 text-sm font-medium transition-colors
                ${method === m ? 'border-b-2 border-green-600 bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <span className="flex items-center justify-center gap-2">
                {m === 'fingerprint' ? <Fingerprint size={16} /> : <KeyRound size={16} />}
                <span>{m === 'fingerprint' ? 'Fingerprint' : 'PIN'}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-6 p-5 sm:p-8">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Select Teacher</label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={e => { setSelectedId(e.target.value); reset() }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
              >
                <option value="">— Choose a teacher —</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.staffId})
                    {t.credentialId ? ' ✓ Enrolled' : ' — Not enrolled'}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {method === 'fingerprint' ? (
            <div className="flex flex-col items-center gap-5 py-4">
              <FingerprintScanner phase={phase} size={140} />
              <p className={`min-h-5 text-center text-sm font-medium
                ${phase === 'success' ? 'text-emerald-600' :
                  phase === 'error' ? 'text-red-500' :
                  phase === 'scanning' ? 'text-green-600' :
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              {message && (
                <p className={`text-center text-sm ${phase === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
                  {message}
                </p>
              )}
              <p className="text-center text-xs text-slate-400">Demo PIN: 1234</p>
            </div>
          )}

          {phase === 'success' && record && (
            <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 animate-fade-up">
              <div className="flex items-center gap-2 font-semibold text-emerald-700">
                <CheckCircle size={18} />
                Attendance Recorded
              </div>
              <div className="space-y-1 text-sm text-emerald-600">
                <p><span className="font-medium">Time:</span> {new Date(record.clockInTime).toLocaleTimeString()}</p>
                <p><span className="font-medium">Date:</span> {new Date(record.clockInTime).toLocaleDateString()}</p>
                <p><span className="font-medium">Method:</span> {record.method === 'fingerprint' ? 'Fingerprint' : 'PIN'}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {phase !== 'success' ? (
              <button
                onClick={method === 'fingerprint' ? handleFingerprint : handlePinClockIn}
                disabled={!selectedId || phase === 'scanning'}
                className="flex-1 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition-all active:scale-95 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                {phase === 'scanning' ? 'Verifying...' : method === 'fingerprint' ? 'Scan Fingerprint' : 'Verify PIN'}
              </button>
            ) : (
              <button
                onClick={reset}
                className="flex-1 rounded-xl bg-slate-100 py-3.5 font-semibold text-slate-700 transition-all hover:bg-slate-200"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

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
