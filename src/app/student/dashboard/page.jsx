'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { hybridStore } from '@/lib/supabase/hybridStore'
import {
  LogIn,
  Radio,
  BookOpen,
  Calendar,
  FileText,
  Sparkles,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Users,
} from 'lucide-react'
import { useAccessibility } from '@/components/AccessibilityProvider'

export default function StudentDashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [classrooms, setClassrooms] = useState([])
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [loading, setLoading] = useState(true)

  const { fontSize, setFontSize, highContrast, setHighContrast } = useAccessibility()

  const loadClassrooms = async () => {
    const list = await hybridStore.fetchClassrooms()
    setClassrooms(list)
    setLoading(false)
  }

  useEffect(() => {
    const user = hybridStore.getCurrentUser()
    if (!user) {
      router.push('/login?role=student')
      return
    }
    if (user.role === 'teacher') {
      router.push('/teacher/dashboard')
      return
    }
    setCurrentUser(user)
    loadClassrooms()

    const unsubscribe = hybridStore.subscribe(null, (event) => {
      if (
        event.type === 'CLASSROOM_CREATED' ||
        event.type === 'CLASSROOM_UPDATED' ||
        event.type === 'CLASSROOM_DELETED' ||
        event.type === 'CLASSROOM_STATUS'
      ) {
        loadClassrooms()
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleJoinClassroom = async (e) => {
    e.preventDefault()
    const cleanCode = joinCode.trim().toUpperCase()
    if (!cleanCode) return

    setIsJoining(true)
    setJoinError('')

    const { classroom, error } = await hybridStore.joinClassroom(cleanCode, currentUser)
    setIsJoining(false)

    if (error) {
      setJoinError(error)
      return
    }
    router.push(`/classroom/${classroom.code}/student`)
  }

  const liveClassrooms = classrooms.filter((c) => c.is_active)
  const pastClassrooms = classrooms.filter((c) => !c.is_active)

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar role="student" />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back,{' '}
              <span className="text-brand-600">{currentUser?.name || currentUser?.full_name || 'Student'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow live captions, send sign language gestures, and review lecture notes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Student
            </span>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
              {(currentUser?.name || currentUser?.full_name || 'ST')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Join Classroom Card */}
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Live Classroom Access
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Join a Classroom with Code
              </h2>
              <p className="mt-2 text-sm text-blue-100 leading-relaxed">
                Enter the 7-character code shared by your teacher to follow real-time speech captions and send sign gestures.
              </p>

              <form onSubmit={handleJoinClassroom} className="mt-6 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="e.g. NXJS428"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase())
                    setJoinError('')
                  }}
                  className="px-5 py-3.5 rounded-xl bg-white text-slate-900 font-mono font-bold text-lg tracking-widest placeholder:text-slate-400 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-4 focus:ring-white/30 flex-1 max-w-sm"
                />
                <button
                  type="submit"
                  disabled={isJoining}
                  className="px-7 py-3.5 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-black transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  {isJoining ? 'Joining...' : 'Join Lecture'}
                </button>
              </form>

              {joinError && (
                <p className="mt-2 text-xs font-semibold text-rose-200">{joinError}</p>
              )}
            </div>
          </div>

          {/* Active Live Classrooms */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-live-ping" />
                <h3 className="text-lg font-bold text-slate-900">Active Live Classrooms</h3>
              </div>
              <span className="text-xs text-slate-500">{liveClassrooms.length} in session</span>
            </div>

            {loading ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400">
                Loading classrooms...
              </div>
            ) : liveClassrooms.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400">
                <Radio className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No active classrooms right now</p>
                <p className="text-xs text-slate-400 mt-1">
                  Use the code entry above when your teacher starts a lecture.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {liveClassrooms.map((c) => {
                  const attendeesCount = (c.students || []).length || c.student_count || 0
                  return (
                    <div
                      key={c.code}
                      className="bg-white p-6 rounded-2xl border border-brand-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                            Live Now
                          </span>
                          <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                            {c.code}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">{c.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{c.subject}</p>
                        <p className="text-xs text-slate-400 mt-1">Teacher: {c.teacher_name}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{attendeesCount} student{attendeesCount === 1 ? '' : 's'}</span>
                        </div>
                        <Link
                          href={`/classroom/${c.code}/student`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-xs transition"
                        >
                          Enter Classroom <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Previous Lectures & Transcripts */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Previous Lecture Transcripts</h3>
            {pastClassrooms.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No previous lecture history yet</p>
                <p className="text-xs text-slate-400 mt-1">Completed lectures will appear here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                {pastClassrooms.map((c) => (
                  <div
                    key={c.code}
                    className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                        <p className="text-xs text-slate-500">{c.subject}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                          <span>Code: {c.code}</span>
                          <span>•</span>
                          <span>Instructor: {c.teacher_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/classroom/${c.code}/summary`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                        AI Summary & Notes
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
