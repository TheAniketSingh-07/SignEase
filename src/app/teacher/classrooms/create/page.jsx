'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { hybridStore } from '@/lib/supabase/hybridStore'
import { Calendar, BookOpen, Layers, FileText, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function CreateClassroomPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const classroom = await hybridStore.createClassroom({
        name,
        subject,
        description,
        scheduledDate,
      })

      // Redirect to Screen 6: Classroom Created with genuine 7-char code
      router.push(`/teacher/classrooms/${classroom.code}/created`)
    } catch (err) {
      console.error('Create classroom error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Dark Navy Sidebar */}
      <Sidebar role="teacher" />

      {/* Main Form Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/teacher/dashboard"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Create New Classroom</h1>
              <p className="text-xs text-slate-500">
                Set up your classroom and generate a unique code for students to join.
              </p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-3xl mx-auto">
          {/* Card Container (Screen 5) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Create New Classroom
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Set up your classroom and generate a unique code for students to join.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Class Name & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Class Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Web Development"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Introduction to API Routes and Dynamic Routing"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Date
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
              </div>

              {/* Submit Button (Screen 5) */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-xl text-base font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 focus:ring-4 focus:ring-brand-500/25 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
