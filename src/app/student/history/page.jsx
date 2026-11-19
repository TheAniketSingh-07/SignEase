'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { hybridStore } from '@/lib/supabase/hybridStore'
import { FileText, Sparkles, Download, Calendar, BookOpen } from 'lucide-react'

export default function StudentHistoryPage() {
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

  const pastClassrooms = classrooms.filter((c) => !c.is_active)

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar role="student" />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200/80 px-8 py-5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Study History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Previous lecture transcripts, notes, and study guides
          </p>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading your history...</div>
          ) : pastClassrooms.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No Lecture History Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once lectures conclude, their full transcripts and AI summaries will be accessible here.
              </p>
              <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition shadow-xs mt-2"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
              {pastClassrooms.map((c) => (
                <div
                  key={c.code}
                  className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md">
                        {c.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{c.subject}</p>
                    <p className="text-xs text-slate-400 mt-1">Instructor: {c.teacher_name}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/classroom/${c.code}/summary`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Open Summary & Notes
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
