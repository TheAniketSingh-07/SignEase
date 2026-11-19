'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Logo from './ui/Logo'
import {
  LayoutDashboard,
  GraduationCap,
  History,
  Settings,
  LogOut,
  PlusCircle,
  Sparkles,
} from 'lucide-react'
import { hybridStore } from '../lib/supabase/hybridStore'

export default function Sidebar({ role = 'teacher' }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    hybridStore.logout()
    router.push('/login')
  }

  const teacherNavItems = [
    {
      label: 'Dashboard',
      href: '/teacher/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Classrooms',
      href: '/teacher/classrooms',
      icon: GraduationCap,
    },
    {
      label: 'History',
      href: '/teacher/history',
      icon: History,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ]

  const studentNavItems = [
    {
      label: 'Dashboard',
      href: '/student/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Classrooms',
      href: '/student/classrooms',
      icon: GraduationCap,
    },
    {
      label: 'History',
      href: '/student/history',
      icon: History,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ]

  const navItems = role === 'teacher' ? teacherNavItems : studentNavItems

  return (
    <aside className="w-64 bg-navy-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80">
        <Logo light={true} />
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-[11px] font-semibold tracking-wide text-brand-300 uppercase">
          <Sparkles className="w-3 h-3 text-brand-400" />
          {role === 'teacher' ? 'Instructor Portal' : 'Student Portal'}
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/teacher/dashboard' &&
              item.href !== '/student/dashboard' &&
              pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          )
        })}

        {role === 'teacher' && (
          <div className="pt-4 mt-4 border-t border-slate-800">
            <Link
              href="/teacher/classrooms/create"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-brand-300 bg-brand-950/60 hover:bg-brand-900/50 border border-brand-800/40 transition"
            >
              <PlusCircle className="w-4 h-4 text-brand-400" />
              New Classroom
            </Link>
          </div>
        )}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          Logout
        </button>
      </div>
    </aside>
  )
}
