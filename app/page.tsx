import Link from 'next/link'
import { Fingerprint, LayoutDashboard, UserPlus, ShieldCheck, Clock, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col items-center text-center py-16 gap-12">
      {/* Hero */}
      <div className="space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium border border-green-100">
          <ShieldCheck size={14} />
         Secured Biometric Attendance
        </div>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight">
          Smart Attendance<br />
          <span className="text-green-600">for Modern Schools</span>
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Secure fingerprint-based clock-in for teachers. Real-time admin dashboard.
          No more paper registers or buddy punching.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl">
        <Link href="/clockin"
          className="group flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border border-slate-200
                     hover:border-green-300 hover:shadow-lg hover:shadow-green-50 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center
                          group-hover:scale-110 transition-transform">
            <Fingerprint size={26} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Clock In</p>
            <p className="text-sm text-slate-400 mt-1">Biometric attendance</p>
          </div>
        </Link>

        <Link href="/register"
          className="group flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border border-slate-200
                     hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-50 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center
                          group-hover:scale-110 transition-transform">
            <UserPlus size={26} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Register</p>
            <p className="text-sm text-slate-400 mt-1">Enroll fingerprint</p>
          </div>
        </Link>

        <Link href="/admin"
          className="group flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border border-slate-200
                     hover:border-green-300 hover:shadow-lg hover:shadow-green-50 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center
                          group-hover:scale-110 transition-transform">
            <LayoutDashboard size={26} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Dashboard</p>
            <p className="text-sm text-slate-400 mt-1">Admin overview</p>
          </div>
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center max-w-lg">
        {[
          { icon: Fingerprint, text: 'WebAuthn Biometrics' },
          { icon: Clock,       text: 'Real-time Clock-in' },
          { icon: Users,       text: 'Teacher Management' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex flex-col items-center gap-2">
            <Icon size={20} className="text-slate-400" />
            <p className="text-xs text-slate-400">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
