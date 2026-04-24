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

  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />
  }

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
    const [t, a, ta] = await Promise.all([
      fetch('/api/teachers').then(r => r.json()),
      fetch('/api/attendance').then(r => r.json()),
      fetch('/api/attendance?filter=today').then(r => r.json()),
    ])
    setTeachers(t)
    setAttendance(a)
    setTodayAtt(ta)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDeregister = async (teacherId: string) => {
    setDeregistering(teacherId)
    try {
      const res = await fetch(`/api/teachers?id=${teacherId}`, { method: 'DELETE' })
      if (res.ok) {
        await load() // Refresh the data
      } else {
        alert('Failed to deregister teacher')
      }
    } catch (error) {
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

  // Filtered views
  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.staffId.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  )

  const filteredToday = todayAtt.filter(r =>
    r.teacherName.toLowerCase().includes(search.toLowerCase()) ||
    r.staffId.toLowerCase().includes(search.toLowerCase())
  )

  const filteredAll = attendance.filter(r =>
    r.teacherName.toLowerCase().includes(search.toLowerCase()) ||
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar size={14} />
            {today}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600
                       rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl
                       text-sm font-medium hover:bg-green-700 transition-all">
            <Download size={14} />
            Export CSV
          </button>
          <button onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl
                       text-sm font-medium hover:bg-red-700 transition-all">
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Teachers" value={teachers.length} color="green"
          icon={<Users size={20} />} />
        <StatCard label="Present Today" value={presentToday}
          sub={`${attendancePct}% attendance`} color="emerald"
          icon={<CheckCircle2 size={20} />} />
        <StatCard label="Absent Today" value={absentToday} color="rose"
          icon={<XCircle size={20} />} />
        <StatCard label="Fingerprints Enrolled" value={enrolled}
          sub={`${teachers.length - enrolled} pending`} color="amber"
          icon={<Fingerprint size={20} />} />
      </div>

      {/* Attendance bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-700">Today's Attendance Rate</p>
          <span className="text-2xl font-bold text-slate-900">{attendancePct}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${attendancePct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>{presentToday} present</span>
          <span>{absentToday} absent</span>
        </div>
      </div>

      {/* Table section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Tab bar + search */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 gap-4">
          <div className="flex gap-1">
            {([
              { key: 'today',    label: "Today's Log" },
              { key: 'all',      label: 'All Records' },
              { key: 'teachers', label: 'Teachers' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all
                  ${tab === key ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-green-200 w-44"
            />
          </div>
        </div>

        {/* Today's log */}
        {tab === 'today' && (
          <div>
            {/* Present */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Teacher</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff ID</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Clock-In</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {teachers
                    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.staffId.toLowerCase().includes(search.toLowerCase()))
                    .map(teacher => {
                      const rec = todayAtt.find(r => r.teacherId === teacher.id)
                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center
                                              text-green-700 text-xs font-bold flex-shrink-0">
                                {teacher.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                              <span className="font-medium text-slate-800">{teacher.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{teacher.staffId}</td>
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
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                ${rec.method === 'fingerprint'
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'bg-slate-100 text-slate-600'}`}>
                                {rec.method === 'fingerprint' ? <Fingerprint size={11} /> : <KeyRound size={11} />}
                                {rec.method}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            {rec ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700
                                               rounded-full text-xs font-medium">
                                <CheckCircle2 size={11} /> Present
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600
                                               rounded-full text-xs font-medium">
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
            {teachers.length === 0 && (
              <div className="text-center py-12 text-slate-400">No teachers found</div>
            )}
          </div>
        )}

        {/* All records */}
        {tab === 'all' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Teacher</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Clock-In</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAll.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">No records yet</td></tr>
                ) : filteredAll.slice().reverse().map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{rec.date}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{rec.teacherName}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{rec.staffId}</td>
                    <td className="px-5 py-3.5 text-slate-600">{rec.subject}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {new Date(rec.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
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
        )}

        {/* Teachers list */}
        {tab === 'teachers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Teacher</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fingerprint</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Enrolled</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTeachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center
                                        text-green-700 text-xs font-bold flex-shrink-0">
                          {t.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-medium text-slate-800">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{t.staffId}</td>
                    <td className="px-5 py-3.5 text-slate-600">{t.subject}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{t.email}</td>
                    <td className="px-5 py-3.5">
                      {t.credentialId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700
                                         rounded-full text-xs font-medium">
                          <Fingerprint size={11} /> Enrolled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700
                                         rounded-full text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {t.enrolledAt ? new Date(t.enrolledAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleDeregister(t.id)}
                        disabled={deregistering === t.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg
                                   text-xs font-medium hover:bg-red-100 transition-all disabled:opacity-50"
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
        )}
      </div>
    </div>
  )
}
