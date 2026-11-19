'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { hybridStore } from '@/lib/supabase/hybridStore'
import {
  Plus,
  Radio,
  Users,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Play,
  FileText,
  Trash2,
} from 'lucide-react'

export default function TeacherDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [classrooms, setClassrooms] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async (user) => {
    if (!user) return
    const list = await hybridStore.fetchClassrooms({ teacherId: user.id })
    setClassrooms(list)
    setLoading(false)
  }

  useEffect(() => {
    const user = hybridStore.getCurrentUser()
    if (!user) {
      router.push('/login?role=teacher')
      return
    }
    if (user.role === 'student') {
      router.push('/student/dashboard')
      return
    }
    setCurrentUser(user)
    loadData(user)

    const unsubscribe = hybridStore.subscribe(null, (event) => {
      if (
        event.type === 'CLASSROOM_CREATED' ||
        event.type === 'CLASSROOM_UPDATED' ||
        event.type === 'CLASSROOM_DELETED' ||
        event.type === 'CLASSROOM_STATUS'
      ) {
        loadData(user)
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleDeleteClassroom = async (code, name) => {
    if (confirm(`Are you sure you want to permanently delete classroom "${name}" (${code})?\nThis will remove it for all students as well.`)) {
      await hybridStore.deleteClassroom(code)
      setClassrooms((prev) => prev.filter((c) => c.code.toUpperCase() !== code.toUpperCase()))
    }
  }

  // Real statistics based on actual server data
  const totalClasses = classrooms.length
  const activeClassrooms = classrooms.filter((c) => c.is_active)
  const activeCount = activeClassrooms.length
  const totalStudents = classrooms.reduce((acc, c) => acc + (c.student_count || (c.students || []).length || 0), 0)
  const totalHours = totalClasses * 2

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Dark Navy Sidebar */}
      <Sidebar role="teacher" />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back,{' '}
              <span className="text-brand-600">{currentUser?.name || currentUser?.full_name || 'Instructor'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your classrooms, live speech captions, and student interactions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Teacher
            </span>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
              {(currentUser?.name || currentUser?.full_name || 'T')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Classes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Classes</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalClasses}</p>
              </div>
            </div>

            {/* Active Class */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Active Class</p>
                <p className="text-2xl font-extrabold text-purple-700 mt-0.5">{activeCount}</p>
              </div>
            </div>

            {/* Total Students */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center font-bold shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Students</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalStudents}</p>
              </div>
            </div>

            {/* Total Hours */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Hours</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalHours}</p>
              </div>
            </div>
          </div>

          {/* Section Header with + Create Classroom Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your Classrooms</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Start a live session, monitor student speech captions, and manage classes
              </p>
            </div>

            <Link
              href="/teacher/classrooms/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-sm shadow-brand-500/25 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Create Classroom
            </Link>
          </div>

          {/* Classrooms List Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {classrooms.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-base font-bold text-slate-700">No Classrooms Found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You haven't created any classrooms yet. Click the button below to generate your first classroom and join code.
                </p>
                <Link
                  href="/teacher/classrooms/create"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Classroom
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {classrooms.map((c) => {
                  const isLive = c.is_active
                  const actualStudentCount = c.student_count || (c.students || []).length || 0

                  return (
                    <div
                      key={c.id || c.code}
                      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition"
                    >
                      {/* Left: Icon & Details */}
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            isLive
                              ? 'bg-brand-50 text-brand-600 border border-brand-100'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <BookOpen className="w-6 h-6" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                            <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                              {c.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{c.subject}</p>
                          {c.description && (
                            <p className="text-xs text-slate-400 line-clamp-1">{c.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Middle: Badges & Metadata */}
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500">
                        {/* Status Badge */}
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            Ended
                          </span>
                        )}

                        {/* Real Student Count */}
                        <div className="flex items-center gap-1.5 font-medium text-slate-600">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>{actualStudentCount} {actualStudentCount === 1 ? 'student' : 'students'}</span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{isLive ? `Started ${c.started_at || 'Recently'}` : (c.scheduled_date || 'Past session')}</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <Link
                          href={`/classroom/${c.code}/teacher`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-xs transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          {isLive ? 'Join Live' : 'Open Room'}
                        </Link>

                        <Link
                          href={`/classroom/${c.code}/summary`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          Summary
                        </Link>

                        {/* Delete Classroom Button */}
                        <button
                          onClick={() => handleDeleteClassroom(c.code, c.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
                          title="Delete Classroom Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
