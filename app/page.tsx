import Link from 'next/link'
import { Fingerprint, LayoutDashboard, UserPlus, ShieldCheck, Clock, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-10 py-10 text-center sm:gap-12 sm:py-16">
      {/* Hero */}
      <div className="max-w-2xl space-y-4 px-1">
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 sm:px-4 sm:text-sm">
          <ShieldCheck size={14} />
          <span className="truncate">Secured Biometric Attendance</span>
        </div>
        <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Smart Attendance<br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          <span className="text-green-600">for Modern Schools</span>
        </h1>
        <p className="text-base leading-relaxed text-slate-500 sm:text-lg">
          Secure fingerprint-based clock-in for teachers. Real-time admin dashboard.
          No more paper registers or buddy punching.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
        <Link href="/clockin"
          className="group flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8
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
          className="group flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8
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
          className="group flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8
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
      <div className="grid max-w-lg grid-cols-1 gap-5 text-center sm:grid-cols-3 sm:gap-8">
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
