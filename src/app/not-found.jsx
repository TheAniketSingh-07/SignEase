import React from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import { Home, ArrowLeft, LogIn, UserPlus } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 sm:p-10">
      <div>
        <Logo />
      </div>

      <div className="max-w-md w-full mx-auto text-center space-y-6 my-auto py-12">
        <div className="w-20 h-20 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto text-3xl font-extrabold shadow-sm border border-brand-100">
          404
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Page Not Found
        </h1>

        <p className="text-sm text-slate-500 leading-relaxed">
          The page you are looking for doesn't exist, has been removed, or the link may be broken.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-sm transition"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition"
          >
            <LogIn className="w-4 h-4 text-slate-500" />
            Log In
          </Link>

          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition"
          >
            <UserPlus className="w-4 h-4 text-brand-600" />
            Register
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        SignEase — Accessible Classroom Platform
      </div>
    </div>
  )
}
