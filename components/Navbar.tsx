'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, UserPlus, Fingerprint, GraduationCap, Menu, X } from 'lucide-react'

const links = [
  { href: '/clockin',  label: 'Clock In',  icon: Fingerprint },
  { href: '/register', label: 'Register',  icon: UserPlus },
  { href: '/admin',    label: 'Dashboard', icon: LayoutDashboard },
]

export default function Navbar() {
  const path = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 font-semibold text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="truncate text-sm sm:text-base">Celias Attendance</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? 'bg-green-50 text-green-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-50 sm:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="absolute left-0 right-0 top-full bg-white border-b border-slate-100 shadow-lg sm:hidden">
            <nav className="flex flex-col py-2">
              {links.map(({ href, label, icon: Icon }) => {
                const active = path.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all
                      ${active
                        ? 'bg-green-50 text-green-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
