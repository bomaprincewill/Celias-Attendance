'use client'

import { useState, useEffect } from 'react'
import FingerprintScanner from '@/components/FingerprintScanner'
import { Teacher } from '@/lib/types'
import { CheckCircle, Plus, ChevronDown, AlertCircle } from 'lucide-react'

type Phase = 'idle' | 'scanning' | 'success' | 'error'

export default function RegisterPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<'enroll' | 'add'>('enroll')

  // New teacher form
  const [form, setForm] = useState({ name: '', staffId: '', subject: '', email: '', phone: '' })
  const [adding, setAdding] = useState(false)
  const [addMsg, setAddMsg] = useState('')

  useEffect(() => {
    fetch('/api/teachers').then(r => r.json()).then(setTeachers)
  }, [])

  const selected = teachers.find(t => t.id === selectedId)

  async function handleEnroll() {
    if (!selected) return setMessage('Select a teacher first')

    setPhase('scanning')
    setMessage('Place your finger on the sensor to enroll...')

    try {
      // 1. Get challenge
      const challengeRes = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: selectedId }),
      })
      const { challenge } = await challengeRes.json()

      // 2. Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: base64urlToBuffer(challenge),
          rp: { name: 'EduAttend', id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(selected.id),
            name: selected.email,
            displayName: selected.name,
          },
          pubKeyCredParams: [
            { alg: -7,   type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
          },
          timeout: 30000,
          attestation: 'none',
        },
      }) as PublicKeyCredential

      const attRes = credential.response as AuthenticatorAttestationResponse

      // 3. Register on server
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: selectedId,
          credential: {
            id: credential.id,
            response: {
              clientDataJSON: bufferToBase64url(attRes.clientDataJSON),
              attestationObject: bufferToBase64url(attRes.attestationObject),
            },
          },
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setPhase('success')
        setMessage(`Fingerprint enrolled successfully for ${selected.name}!`)
        fetch('/api/teachers').then(r => r.json()).then(setTeachers)
      } else {
        setPhase('error')
        setMessage(data.error || 'Enrollment failed')
      }
    } catch (err: any) {
      setPhase('error')
      if (err.name === 'NotAllowedError') {
        setMessage('Fingerprint scan was cancelled.')
      } else if (err.name === 'NotSupportedError') {
        setMessage('WebAuthn not supported on this device/browser.')
      } else {
        setMessage('Enrollment failed: ' + err.message)
      }
    }
  }

  async function handleAddTeacher(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setAddMsg('')
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setTeachers(t => [...t, data])
        setForm({ name: '', staffId: '', subject: '', email: '', phone: '' })
        setAddMsg('Teacher added successfully!')
      } else {
        setAddMsg(data.error || 'Failed to add teacher')
      }
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Biometric Registration</h1>
        <p className="text-slate-500 mt-2">Enroll fingerprints or add new teachers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-6">
        {[
          { key: 'enroll', label: 'Enroll Fingerprint' },
          { key: 'add',    label: 'Add New Teacher' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all
              ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        {tab === 'enroll' ? (
          <div className="space-y-6">
            {/* Teacher select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Teacher</label>
              <div className="relative">
                <select
                  value={selectedId}
                  onChange={e => { setSelectedId(e.target.value); setPhase('idle'); setMessage('') }}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                             text-slate-800 pr-10 focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  <option value="">— Choose a teacher —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.subject}
                      {t.credentialId ? ' ✓ Re-enroll' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {selected && (
              <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 space-y-1 border border-slate-100">
                <p><span className="font-medium text-slate-800">{selected.name}</span></p>
                <p>{selected.subject} · {selected.staffId}</p>
                <p>{selected.email}</p>
                {selected.credentialId ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs bg-emerald-50
                                   border border-emerald-100 px-2.5 py-1 rounded-full mt-1">
                    <CheckCircle size={12} /> Enrolled — re-enrollment will replace existing fingerprint
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-xs bg-amber-50
                                   border border-amber-100 px-2.5 py-1 rounded-full mt-1">
                    <AlertCircle size={12} /> Not yet enrolled
                  </span>
                )}
              </div>
            )}

            {/* Scanner */}
            <div className="flex flex-col items-center gap-5 py-4">
              <FingerprintScanner phase={phase} size={150} />
              <p className={`text-sm font-medium text-center min-h-5
                ${phase === 'success' ? 'text-emerald-600' :
                  phase === 'error'   ? 'text-red-500' :
                  phase === 'scanning'? 'text-green-600' : 'text-slate-400'}`}>
                {message || 'Select a teacher and click Enroll Fingerprint'}
              </p>
            </div>

            <button
              onClick={phase === 'success' ? () => { setPhase('idle'); setMessage(''); setSelectedId('') } : handleEnroll}
              disabled={!selectedId || phase === 'scanning'}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400
                         text-white font-semibold py-3.5 rounded-xl transition-all active:scale-95"
            >
              {phase === 'scanning' ? 'Enrolling...' :
               phase === 'success'  ? 'Enroll Another' :
               'Enroll Fingerprint'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddTeacher} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Mrs. Adaeze Okonkwo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                             focus:outline-none focus:ring-2 focus:ring-green-300 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Staff ID *</label>
                <input
                  required
                  value={form.staffId}
                  onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}
                  placeholder="STF-006"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                             focus:outline-none focus:ring-2 focus:ring-green-300 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
                <input
                  required
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Mathematics"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                             focus:outline-none focus:ring-2 focus:ring-green-300 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="teacher@school.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                             focus:outline-none focus:ring-2 focus:ring-green-300 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="08012345678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                             focus:outline-none focus:ring-2 focus:ring-green-300 text-slate-800"
                />
              </div>
            </div>

            {addMsg && (
              <p className={`text-sm font-medium ${addMsg.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>
                {addMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={adding}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
                         disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3.5
                         rounded-xl transition-all active:scale-95"
            >
              <Plus size={18} />
              {adding ? 'Adding...' : 'Add Teacher'}
            </button>
          </form>
        )}
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
