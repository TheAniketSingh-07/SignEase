'use client'

import React from 'react'
import Link from 'next/link'
import Logo from './ui/Logo'
import { Home, ArrowLeft, LayoutDashboard, Search, AlertCircle } from 'lucide-react'

export default function ClassroomNotFound({ code, title, message, backHref = '/student/dashboard', backLabel = 'Enter Another Code' }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 sm:p-10">
      <div>
        <Logo />
      </div>

      <div className="max-w-md w-full mx-auto text-center space-y-6 my-auto py-12">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-3xl font-extrabold shadow-sm border border-rose-100">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/80 text-rose-700 mb-2">
            {message ? 'Access Problem' : 'Classroom Not Found'}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {title || 'Invalid Classroom Code'}
          </h1>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed">
          {message ? (
            message
          ) : code ? (
            <>
              Classroom code <span className="font-mono font-bold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded">{code}</span> does not exist, has expired, or has concluded.
            </>
          ) : (
            'The classroom you are trying to access could not be found or has ended.'
          )}
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
            href={backHref}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition"
          >
            <Search className="w-4 h-4 text-slate-500" />
            {backLabel}
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        SignEase — Accessible Classroom Platform
      </div>
    </div>
  )
}
