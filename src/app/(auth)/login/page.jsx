'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import { hybridStore } from '@/lib/supabase/hybridStore'
import { GraduationCap, School, Sparkles, LogIn } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || 'teacher'
  const redirectUrl = searchParams.get('redirect')
  const classroomCode = searchParams.get('code')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(defaultRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(searchParams.get('error') || '')

  // If the user is already signed in (verified by the server), skip the form
  useEffect(() => {
    let cancelled = false
    hybridStore.syncSession().then((u) => {
      // Only skip the form when the signed-in role matches what this page asks for;
      // otherwise a student sent here from a teacher-only page would bounce forever.
      if (cancelled || !u || u.role !== defaultRole) return
      if (redirectUrl) router.replace(decodeURIComponent(redirectUrl))
      else if (classroomCode && u.role === 'student') router.replace(`/classroom/${classroomCode.toUpperCase()}/student`)
      else router.replace(u.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { user, error: loginErr } = await hybridStore.login(email, password, role)
      if (loginErr) {
        setError(loginErr.message || 'Login failed')
        setLoading(false)
        return
      }

      // The account's real role wins over the role card that was selected
      if (user.role !== role) {
        router.push(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
        return
      }

      // DIRECT REDIRECT RULE: If redirect URL provided, go directly there!
      if (redirectUrl) {
        router.push(decodeURIComponent(redirectUrl))
        return
      }

      // If joining with code directly
      if (classroomCode) {
        router.push(`/classroom/${classroomCode.toUpperCase()}/${role === 'teacher' ? 'teacher' : 'student'}`)
        return
      }

      // Default portal
      if (user.role === 'teacher') {
        router.push('/teacher/dashboard')
      } else {
        router.push('/student/dashboard')
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  // Google OAuth: hand over to the server, which redirects to Google's real account chooser
  const handleGoogleAuth = () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ role })
    let dest = redirectUrl ? decodeURIComponent(redirectUrl) : ''
    if (!dest && classroomCode && role === 'student') {
      dest = `/classroom/${classroomCode.toUpperCase()}/student`
    }
    if (dest) params.set('redirect', dest)
    window.location.href = `/api/auth/google?${params.toString()}`
  }

  // Quick fill helper for testers
  const handleDemoFill = (selectedRole) => {
    if (selectedRole === 'teacher') {
      setEmail('teacher@signease.edu')
      setPassword('password123')
      setRole('teacher')
    } else {
      setEmail('student@signease.edu')
      setPassword('password123')
      setRole('student')
    }
  }

  return (
    <div className="max-w-md w-full mx-auto my-auto py-10">
      {classroomCode && (
        <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-2xl flex items-center gap-3 text-brand-900">
          <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">
            {classroomCode.slice(0, 2)}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Classroom Join Request</p>
            <p className="text-xs text-brand-800">
              Sign in as a <span className="font-bold underline">{role === 'teacher' ? 'Teacher' : 'Student'}</span> to enter room <span className="font-mono font-bold">{classroomCode}</span> directly.
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome Back
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Login to continue as {role === 'teacher' ? 'Teacher / Instructor' : 'Student'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold flex items-center justify-center gap-3 transition shadow-2xs hover:border-slate-300 disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
            Or with email
          </span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
          />
        </div>

        {/* Role Selection Cards */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Teacher Card */}
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                role === 'teacher'
                  ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  role === 'teacher'
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <School className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Teacher</p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Start and manage classrooms
                </p>
              </div>
            </button>

            {/* Student Card */}
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                role === 'student'
                  ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  role === 'student'
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Student</p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Join classrooms and view captions
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:ring-4 focus:ring-brand-500/25 transition shadow-sm shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          {loading ? 'Logging in...' : redirectUrl ? 'Log In & Continue Directly' : 'Log In'}
        </button>
      </form>

      {/* Quick Demo fill bar */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-3">
        <span className="text-xs text-slate-400">1-Click Test:</span>
        <button
          type="button"
          onClick={() => handleDemoFill('teacher')}
          className="px-2.5 py-1 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition"
        >
          Fill Teacher
        </button>
        <button
          type="button"
          onClick={() => handleDemoFill('student')}
          className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
        >
          Fill Student
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <Link
          href={`/register${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}${classroomCode ? `&code=${classroomCode}` : ''}&role=${role}`}
          className="font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-4"
        >
          Create Account / Register
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left Column: Login Form */}
      <div className="lg:col-span-6 flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        <div>
          <Logo />
        </div>

        <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading login...</div>}>
          <LoginForm />
        </Suspense>

        <div className="text-center text-xs text-slate-400">
          SignEase Accessibility Platform © {new Date().getFullYear()}
        </div>
      </div>

      {/* Right Column: Inspirational Visual Panel */}
      <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-slate-100 p-12 flex-col justify-between relative overflow-hidden border-l border-slate-200/60">
        <div className="max-w-md mx-auto my-auto text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-brand-700 text-xs font-semibold shadow-2xs border border-brand-100">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Inclusive Learning Vision</span>
          </div>

          <blockquote className="text-3xl font-extrabold text-brand-700 leading-snug tracking-tight">
            “ Same Classroom.
            <br />
            Same Knowledge.
            <br />
            Equal Opportunities. ”
          </blockquote>

          {/* Accessible Classroom Visual */}
          <div className="relative mx-auto w-84 h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white flex items-center justify-center">
            <img
              src="/images/classroom-inclusive.jpg"
              alt="Inclusive Classroom Education"
              className="w-full h-full object-cover"
            />
            {/* Overlay Gradient & Badge */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-left">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/20">
                🤟 Deaf & Hard-of-Hearing Inclusive
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Designed to bridge the gap between spoken lectures and visual learning for deaf and hard-of-hearing students worldwide.
          </p>
        </div>
      </div>
    </div>
  )
}
