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
      const challengeRes = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: selectedId }),
      })
      const { challenge } = await challengeRes.json()

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
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
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
        setMessage(`Enrollment failed: ${err.message}`)
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
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Biometric Registration</h1>
        <p className="mt-2 text-slate-500">Enroll fingerprints or add new teachers</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2 rounded-2xl bg-slate-100 p-1 sm:grid-cols-2 sm:gap-1">
        {[
          { key: 'enroll', label: 'Enroll Fingerprint' },
          { key: 'add', label: 'Add New Teacher' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as 'enroll' | 'add')}
            className={`rounded-xl py-2.5 text-sm font-medium transition-all
              ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        {tab === 'enroll' ? (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Select Teacher</label>
              <div className="relative">
                <select
                  value={selectedId}
                  onChange={e => { setSelectedId(e.target.value); setPhase('idle'); setMessage('') }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  <option value="">— Choose a teacher —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.subject}
                      {t.credentialId ? ' ✓ Re-enroll' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {selected && (
              <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                <p><span className="font-medium text-slate-800">{selected.name}</span></p>
                <p>{selected.subject} · {selected.staffId}</p>
                <p className="break-all sm:break-normal">{selected.email}</p>
                {selected.credentialId ? (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                    <CheckCircle size={12} /> Enrolled — re-enrollment will replace existing fingerprint
                  </span>
                ) : (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                    <AlertCircle size={12} /> Not yet enrolled
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col items-center gap-5 py-4">
              <FingerprintScanner phase={phase} size={150} />
              <p className={`min-h-5 text-center text-sm font-medium
                ${phase === 'success' ? 'text-emerald-600' :
                  phase === 'error' ? 'text-red-500' :
                  phase === 'scanning' ? 'text-green-600' :
                  'text-slate-400'}`}>
                {message || 'Select a teacher and click Enroll Fingerprint'}
              </p>
            </div>

            <button
              onClick={phase === 'success' ? () => { setPhase('idle'); setMessage(''); setSelectedId('') } : handleEnroll}
              disabled={!selectedId || phase === 'scanning'}
              className="w-full rounded-xl bg-green-600 py-3.5 font-semibold text-white transition-all active:scale-95 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400"
            >
              {phase === 'scanning' ? 'Enrolling...' : phase === 'success' ? 'Enroll Another' : 'Enroll Fingerprint'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddTeacher} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Mrs. Adaeze Okonkwo"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Staff ID *</label>
                <input
                  required
                  value={form.staffId}
                  onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}
                  placeholder="STF-006"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject *</label>
                <input
                  required
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Mathematics"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="teacher@school.edu"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="08012345678"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-300"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition-all active:scale-95 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400"
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
