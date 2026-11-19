'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { hybridStore } from '@/lib/supabase/hybridStore'
import { BookOpen, Users, Calendar, ArrowRight, Radio, LogIn } from 'lucide-react'

export default function StudentClassroomsListPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [classrooms, setClassrooms] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const list = await hybridStore.fetchClassrooms()
    setClassrooms(list)
    setLoading(false)
  }

  useEffect(() => {
    const user = hybridStore.getCurrentUser()
    if (!user || user.role !== 'student') {
      router.push('/login?role=student')
      return
    }
    setCurrentUser(user)
    loadData()

    const unsubscribe = hybridStore.subscribe(null, (event) => {
      if (
        event.type === 'CLASSROOM_CREATED' ||
        event.type === 'CLASSROOM_UPDATED' ||
        event.type === 'CLASSROOM_DELETED' ||
        event.type === 'CLASSROOM_STATUS'
      ) {
        loadData()
      }
    })
    return () => unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar role="student" />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200/80 px-8 py-5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active & Joined Classrooms</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your lecture rooms, live caption sessions, and course materials
          </p>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading classrooms...</div>
          ) : classrooms.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No Classrooms Available</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ask your instructor for their 7-character classroom code to join live lectures.
              </p>
              <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition shadow-xs mt-2"
              >
                <LogIn className="w-4 h-4" />
                Join with Code
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classrooms.map((c) => {
                const attendeesCount = (c.students || []).length || c.student_count || 0
                return (
                  <div
                    key={c.code}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
                          {c.code}
                        </span>
                        {c.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                            Live Now
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Ended
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{c.subject}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                        <span>Instructor: {c.teacher_name}</span>
                        <span>•</span>
                        <span>{attendeesCount} student{attendeesCount === 1 ? '' : 's'}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={`/classroom/${c.code}/summary`}
                        className="text-xs font-semibold text-slate-600 hover:text-brand-600"
                      >
                        View Notes
                      </Link>

                      <Link
                        href={`/classroom/${c.code}/student`}
                        className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition shadow-xs"
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
      </main>
    </div>
  )
}
