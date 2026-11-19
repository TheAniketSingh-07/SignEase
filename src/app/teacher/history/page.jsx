'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { hybridStore } from '@/lib/supabase/hybridStore'
import {
  History,
  Download,
  FileText,
  Search,
  Sparkles,
  Calendar,
  Trash2,
  BookOpen,
  ArrowRight,
  Radio,
} from 'lucide-react'

export default function TeacherHistoryPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [classrooms, setClassrooms] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = async (user) => {
    if (!user) return
    const list = await hybridStore.fetchClassrooms({ teacherId: user.id })
    setClassrooms(list)
    setLoading(false)
  }

  useEffect(() => {
    const user = hybridStore.getCurrentUser()
    if (!user || user.role !== 'teacher') {
      router.push('/login?role=teacher')
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
    if (
      confirm(
        `Are you sure you want to permanently delete classroom "${name}" (${code})?\nThis will remove it from student portals as well.`
      )
    ) {
      await hybridStore.deleteClassroom(code)
      setClassrooms((prev) => prev.filter((c) => c.code.toUpperCase() !== code.toUpperCase()))
    }
  }

  const filteredClassrooms = classrooms.filter((c) => {
    const q = search.toLowerCase()
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.subject || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar role="teacher" />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lecture & Class History</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Archived transcripts, lecture notes, student attendances, and classroom management
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, subject, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 w-64 shadow-2xs"
            />
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading lecture history...</div>
          ) : filteredClassrooms.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No Classrooms Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {search
                  ? 'No classrooms matched your search term.'
                  : 'You have not created any classrooms yet. Start by creating a new classroom.'}
              </p>
              <Link
                href="/classroom/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition shadow-xs mt-2"
              >
                Create Classroom
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
              {filteredClassrooms.map((c) => {
                const transcripts = c.transcripts || []
                const attendeesCount = (c.students || []).length || c.student_count || 0

                return (
                  <div
                    key={c.code}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                        <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-md">
                          {c.code}
                        </span>
                        {c.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Concluded
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{c.subject}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>Date: {c.scheduled_date || 'Recent'}</span>
                        <span>•</span>
                        <span>{transcripts.length} transcript lines</span>
                        <span>•</span>
                        <span>{attendeesCount} student{attendeesCount === 1 ? '' : 's'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {c.is_active && (
                        <Link
                          href={`/classroom/${c.code}/teacher`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition shadow-xs"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          Resume Live
                        </Link>
                      )}

                      <Link
                        href={`/classroom/${c.code}/summary`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                        AI Summary
                      </Link>

                      <button
                        onClick={() => {
                          const text = transcripts
                            .map((t) => `[${t.timestamp || ''}] ${t.speaker || 'Teacher'}: ${t.text}`)
                            .join('\n')
                          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
                          const a = document.createElement('a')
                          a.href = URL.createObjectURL(blob)
                          a.download = `${c.name}-Transcript.txt`
                          a.click()
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        Download
                      </button>

                      {/* Delete Classroom Button */}
                      <button
                        onClick={() => handleDeleteClassroom(c.code, c.name)}
                        title="Permanently delete classroom"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
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
      </main>
    </div>
  )
}
