'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { hybridStore } from '@/lib/supabase/hybridStore'
import { CheckCircle2, Copy, Check, ArrowRight, Home, Play, Sparkles } from 'lucide-react'

export default function ClassroomCreatedSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.id
  const [classroom, setClassroom] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Launch celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.4 },
      })
    } catch (e) {}

    const loadClass = async () => {
      const found = await hybridStore.getClassroomByCode(code)
      if (found) {
        setClassroom(found)
      } else {
        // Fallback object if code was just created
        setClassroom({
          code,
          name: 'Classroom',
          subject: 'Lecture Session',
          scheduled_date: new Date().toLocaleDateString(),
          description: '',
        })
      }
    }
    loadClass()
  }, [code])

  const handleCopyCode = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/40 via-slate-50 to-white flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-12 text-center relative overflow-hidden">
        {/* Celebration check icon (Screen 6) */}
        <div className="w-20 h-20 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-sm border-2 border-emerald-200 animate-pulse-subtle">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Classroom Created Successfully!
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
          Share this code with your students to join the class.
        </p>

        {/* Huge Room Code Display Box (Screen 6) */}
        <div className="my-8 p-5 bg-brand-50/70 border-2 border-dashed border-brand-300 rounded-2xl flex items-center justify-between gap-4 max-w-md mx-auto">
          <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-brand-700 pl-4 select-all">
            {code}
          </span>
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-sm transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Code
              </>
            )}
          </button>
        </div>

        {/* Classroom Summary Details Card (Screen 6) */}
        {classroom && (
          <div className="mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-200/70 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">
                Class Name:
              </span>
              <span className="font-bold text-slate-900 text-sm">{classroom.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">
                Subject:
              </span>
              <span className="font-medium text-slate-800">{classroom.subject}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">
                Date:
              </span>
              <span className="font-medium text-slate-800">
                {classroom.scheduled_date || new Date().toLocaleDateString()}
              </span>
            </div>
            {classroom.description && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Description:
                </span>
                <p className="text-slate-600 leading-relaxed">{classroom.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Bottom Action Buttons (Screen 6) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/classroom/${code}/teacher`}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-brand-500/25 transition transform hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 fill-current" />
            Start Classroom
          </Link>
          <Link
            href="/teacher/dashboard"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition"
          >
            <Home className="w-4 h-4 text-slate-500" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
