'use client'

import { useState, useEffect, useCallback } from 'react'
import { Teacher, AttendanceRecord } from '@/lib/types'
import StatCard from '@/components/StatCard'
import AdminLogin from '@/components/AdminLogin'
import { useAdminAuth } from '@/lib/AdminAuthContext'
import {
  Users, CheckCircle2, XCircle, Calendar, RefreshCw,
  Download, Fingerprint, KeyRound, Search, Clock, LogOut, Trash2
} from 'lucide-react'

export default function AdminDashboard() {
  const { isAuthenticated, login, logout } = useAdminAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [todayAtt, setTodayAtt] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'today' | 'all' | 'teachers'>('today')
  const [refreshing, setRefreshing] = useState(false)
  const [deregistering, setDeregistering] = useState<string | null>(null)

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const [t, a, ta] = await Promise.all([
        fetch('/api/teachers').then(parseJsonResponse),
        fetch('/api/attendance').then(parseJsonResponse),
        fetch('/api/attendance?filter=today').then(parseJsonResponse),
      ])
      setTeachers(Array.isArray(t) ? t : [])
      setAttendance(Array.isArray(a) ? a : [])
      setTodayAtt(Array.isArray(ta) ? ta : [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    load()
  }, [isAuthenticated, load])

  const handleDeregister = async (teacherId: string) => {
    setDeregistering(teacherId)
    try {
      const res = await fetch(`/api/teachers?id=${teacherId}`, { method: 'DELETE' })
      if (res.ok) {
        await load()
      } else {
        alert('Failed to deregister teacher')
      }
    } catch {
      alert('Error deregistering teacher')
    } finally {
      setDeregistering(null)
    }
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const enrolled = teachers.filter(t => t.credentialId).length
  const presentToday = todayAtt.length
  const absentToday = teachers.length - presentToday
  const attendancePct = teachers.length ? Math.round((presentToday / teachers.length) * 100) : 0
  const clockedInIds = new Set(todayAtt.map(r => r.teacherId))
  const searchTerm = search.toLowerCase()

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchTerm) ||
    t.staffId.toLowerCase().includes(searchTerm) ||
    t.subject.toLowerCase().includes(searchTerm)
  )

  const filteredAll = attendance.filter(r =>
    r.teacherName.toLowerCase().includes(searchTerm) ||
    r.date.includes(search)
  )

  function exportCSV() {
    const header = 'Date,Staff ID,Name,Subject,Clock-In Time,Method\n'
    const rows = attendance.map(r =>
      `${r.date},${r.staffId},"${r.teacherName}",${r.subject},${new Date(r.clockInTime).toLocaleTimeString()},${r.method}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 flex items-center gap-1.5 text-slate-500">
            <Calendar size={14} />
            {today}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            onClick={load}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-700"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-700"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Teachers" value={teachers.length} color="green" icon={<Users size={20} />} />
        <StatCard label="Present Today" value={presentToday} sub={`${attendancePct}% attendance`} color="emerald" icon={<CheckCircle2 size={20} />} />
        <StatCard label="Absent Today" value={absentToday} color="rose" icon={<XCircle size={20} />} />
        <StatCard label="Fingerprints Enrolled" value={enrolled} sub={`${teachers.length - enrolled} pending`} color="amber" icon={<Fingerprint size={20} />} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-700">Today's Attendance Rate</p>
          <span className="text-2xl font-bold text-slate-900">{attendancePct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${attendancePct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>{presentToday} present</span>
          <span>{absentToday} absent</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1">
            {([
              { key: 'today', label: "Today's Log" },
              { key: 'all', label: 'All Records' },
              { key: 'teachers', label: 'Teachers' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all
                  ${tab === key ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 lg:w-52"
            />
          </div>
        </div>

        {tab === 'today' && (
          <div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Teacher</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Staff ID</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Clock-In</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Method</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTeachers.map(teacher => {
                    const rec = todayAtt.find(r => r.teacherId === teacher.id)
                    return (
                      <tr key={teacher.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                              {teacher.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <span className="font-medium text-slate-800">{teacher.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{teacher.staffId}</td>
                        <td className="px-5 py-3.5 text-slate-600">{teacher.subject}</td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {rec ? (
                            <span className="flex items-center gap-1.5">
                              <Clock size={13} className="text-slate-400" />
                              {new Date(rec.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {rec ? (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
                              ${rec.method === 'fingerprint' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                              {rec.method === 'fingerprint' ? <Fingerprint size={11} /> : <KeyRound size={11} />}
                              {rec.method}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {rec ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              <CheckCircle2 size={11} /> Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                              <XCircle size={11} /> Absent
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {filteredTeachers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No teachers found</div>
              ) : filteredTeachers.map(teacher => {
                const rec = todayAtt.find(r => r.teacherId === teacher.id)
                return (
                  <div key={teacher.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">{teacher.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{teacher.staffId} · {teacher.subject}</p>
                      </div>
                      {rec ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 size={11} /> Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                          <XCircle size={11} /> Absent
                        </span>
                      )}
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p><span className="font-medium text-slate-700">Clock-in:</span> {rec ? new Date(rec.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                      <p><span className="font-medium text-slate-700">Method:</span> {rec ? rec.method : '—'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'all' && (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Teacher</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Staff ID</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Clock-In</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAll.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400">No records yet</td></tr>
                  ) : filteredAll.slice().reverse().map(rec => (
                    <tr key={rec.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{rec.date}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{rec.teacherName}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{rec.staffId}</td>
                      <td className="px-5 py-3.5 text-slate-600">{rec.subject}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {new Date(rec.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
                          ${rec.method === 'fingerprint' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {rec.method === 'fingerprint' ? <Fingerprint size={11} /> : <KeyRound size={11} />}
                          {rec.method}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {filteredAll.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No records yet</div>
              ) : filteredAll.slice().reverse().map(rec => (
                <div key={rec.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{rec.teacherName}</p>
                      <p className="mt-1 text-xs text-slate-500">{rec.staffId} · {rec.subject}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
                      ${rec.method === 'fingerprint' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {rec.method === 'fingerprint' ? <Fingerprint size={11} /> : <KeyRound size={11} />}
                      {rec.method}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p><span className="font-medium text-slate-700">Date:</span> {rec.date}</p>
                    <p><span className="font-medium text-slate-700">Clock-in:</span> {new Date(rec.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'teachers' && (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Teacher</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Staff ID</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fingerprint</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Enrolled</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTeachers.map(t => (
                    <tr key={t.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                            {t.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <span className="font-medium text-slate-800">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{t.staffId}</td>
                      <td className="px-5 py-3.5 text-slate-600">{t.subject}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{t.email}</td>
                      <td className="px-5 py-3.5">
                        {t.credentialId ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <Fingerprint size={11} /> Enrolled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {t.enrolledAt ? new Date(t.enrolledAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleDeregister(t.id)}
                          disabled={deregistering === t.id}
                          className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          {deregistering === t.id ? 'Removing...' : 'Deregister'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {filteredTeachers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No teachers found</div>
              ) : filteredTeachers.map(t => (
                <div key={t.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{t.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{t.staffId} · {t.subject}</p>
                    </div>
                    {t.credentialId ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <Fingerprint size={11} /> Enrolled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p><span className="font-medium text-slate-700">Email:</span> <span className="break-all">{t.email}</span></p>
                    <p><span className="font-medium text-slate-700">Enrolled:</span> {t.enrolledAt ? new Date(t.enrolledAt).toLocaleDateString() : '—'}</p>
                    <p><span className="font-medium text-slate-700">Today:</span> {clockedInIds.has(t.id) ? 'Present' : 'Absent'}</p>
                  </div>
                  <button
                    onClick={() => handleDeregister(t.id)}
                    disabled={deregistering === t.id}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    {deregistering === t.id ? 'Removing...' : 'Deregister'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

async function parseJsonResponse(response: Response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Server returned an invalid response')
  }
}
