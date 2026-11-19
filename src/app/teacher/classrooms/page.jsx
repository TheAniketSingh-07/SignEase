'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { hybridStore } from '@/lib/supabase/hybridStore'
import { Plus, BookOpen, Users, Calendar, Play, FileText, Search, Trash2, Sparkles } from 'lucide-react'

export default function TeacherClassroomsListPage() {
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
    if (confirm(`Are you sure you want to delete classroom "${name}" (${code})?\nThis will remove it for all students.`)) {
      await hybridStore.deleteClassroom(code)
      setClassrooms((prev) => prev.filter((c) => c.code.toUpperCase() !== code.toUpperCase()))
    }
  }

  const filtered = classrooms.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.code || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar role="teacher" />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage Classrooms</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              All your created lecture rooms, join codes, and recordings
            </p>
          </div>

          <Link
            href="/teacher/classrooms/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 transition shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            New Classroom
          </Link>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-6">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search classrooms by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading classrooms...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No Classrooms Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first classroom to generate a student join code and start live captioning.
              </p>
              <Link
                href="/teacher/classrooms/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 transition mt-2"
              >
                <Plus className="w-4 h-4" />
                Create Classroom
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
              {filtered.map((c) => {
                const attendeesCount = (c.students || []).length || c.student_count || 0
                return (
                  <div
                    key={c.code}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          c.is_active
                            ? 'bg-brand-50 text-brand-600 border border-brand-100'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                          <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            {c.code}
                          </span>
                          {c.is_active && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Live Now
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{c.subject}</p>
                        <p className="text-xs text-slate-400 mt-1">{c.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span>{attendeesCount} student{attendeesCount === 1 ? '' : 's'}</span>
                          <span>•</span>
                          <span>{(c.transcripts || []).length} transcript lines</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {c.is_active ? (
                        <Link
                          href={`/classroom/${c.code}/teacher`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Resume Live
                        </Link>
                      ) : (
                        <Link
                          href={`/classroom/${c.code}/summary`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                          Summary
                        </Link>
                      )}

                      <button
                        onClick={() => handleDeleteClassroom(c.code, c.name)}
                        title="Delete Classroom"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
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
