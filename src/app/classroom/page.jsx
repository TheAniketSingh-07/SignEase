'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import { hybridStore } from '@/lib/supabase/hybridStore'
import { LogIn, ArrowLeft, BookOpen, Sparkles } from 'lucide-react'

export default function ClassroomEntryPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = hybridStore.getCurrentUser()
    if (user) {
      if (user.role === 'teacher') {
        router.replace('/teacher/classrooms')
      } else {
        router.replace('/student/dashboard')
      }
    }
  }, [router])

  const handleJoin = async (e) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) return

    setLoading(true)
    setError('')

    const exists = await hybridStore.getClassroomByCode(cleanCode)
    if (!exists) {
      setError(`Classroom with code "${cleanCode}" was not found. Please verify the code.`)
      setLoading(false)
      return
    }

    const user = hybridStore.getCurrentUser()
    if (!user) {
      router.push(`/login?code=${cleanCode}&redirect=${encodeURIComponent(`/classroom/${cleanCode}/student`)}`)
    } else {
      router.push(`/classroom/${cleanCode}/${user.role === 'teacher' ? 'teacher' : 'student'}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 sm:p-10">
      <div>
        <Logo />
      </div>

      <div className="max-w-md w-full mx-auto my-auto py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <BookOpen className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Join Live Classroom
            </h1>
            <p className="text-xs text-slate-500">
              Enter your teacher's 7-character join code to enter the lecture.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Classroom Code
              </label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="e.g. NXJS428"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setError('')
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-mono font-bold tracking-widest text-center uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Verifying Code...' : 'Enter Classroom'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        SignEase — Accessible Classroom Platform
      </div>
    </div>
  )
}
