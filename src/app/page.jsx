'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SevaChatbot from '@/components/SevaChatbot'
import {
  Mic,
  Hand,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle,
  Users,
  ShieldCheck,
  Video,
  FileText,
  Volume2,
  ChevronRight,
  Eye,
  FileDown,
  BarChart2,
  HelpCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { hybridStore } from '@/lib/supabase/hybridStore'

export default function HomePage() {
  const router = useRouter()
  const [quickJoinCode, setQuickJoinCode] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)

  // Start Classroom click handler
  const handleStartClassroom = (e) => {
    e.preventDefault()
    const user = hybridStore.getCurrentUser()
    if (user && user.role === 'teacher') {
      router.push('/teacher/classrooms/create')
    } else {
      router.push('/login?role=teacher&redirect=' + encodeURIComponent('/teacher/classrooms/create'))
    }
  }

  // Join Classroom click handler
  const handleQuickJoin = (e) => {
    e.preventDefault()
    const code = quickJoinCode.trim().toUpperCase()
    if (!code) return

    const user = hybridStore.getCurrentUser()
    if (user && user.role === 'student') {
      router.push(`/classroom/${code}/student`)
    } else {
      router.push(
        `/login?role=student&code=${code}&redirect=` +
          encodeURIComponent(`/classroom/${code}/student`)
      )
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section (Matching Screen 1) */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-18 lg:pb-28 bg-gradient-to-b from-brand-50/40 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span>More Inclusive Classrooms</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Breaking Communication Barriers in{' '}
                <span className="text-brand-600 underline decoration-brand-200 decoration-wavy decoration-2">
                  Every Classroom
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Real-time speech captions and supported sign-language recognition designed to
                make classrooms more accessible for deaf and hard-of-hearing students.
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-brand-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all"
                >
                  Log In
                </Link>

                <button
                  onClick={handleStartClassroom}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/80 rounded-xl transition-all"
                >
                  Start Classroom
                </button>

                <button
                  onClick={() => setShowJoinModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Join Classroom
                </button>
              </div>

              {/* Live indicators */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Real-time Speech Captions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>AI Hand Gesture Translation</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual & Main Card */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Background decorative blob */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-brand-200/50 to-indigo-100/60 rounded-3xl filter blur-2xl -z-10" />

                {/* Main Card with Accessible Student Visual */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-b from-blue-100 to-indigo-100 aspect-[4/5] flex items-center justify-center">
                  <img
                    src="/images/hero-student.jpg"
                    alt="Student using sign language in inclusive classroom"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Strip: 4 Feature Highlights matching Screen 1 */}
          <div className="mt-20 pt-10 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/60 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-semibold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Accessible Education</h4>
                <p className="text-xs text-slate-500">Equal classroom equity</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/60 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Real-time Captions</h4>
                <p className="text-xs text-slate-500">Instant speech transcription</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/60 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-semibold">
                <Hand className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Supported Sign Recognition</h4>
                <p className="text-xs text-slate-500">MediaPipe hand gestures</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/60 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-semibold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Interactive Learning</h4>
                <p className="text-xs text-slate-500">Live Polls & Quizzes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section id="features" className="py-20 bg-slate-50/70 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">
              Classroom Superpowers
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Built For Modern Accessible Education
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Real-time speech transcription, AI sign language detection, live student polls, interactive quizzes, and PDF resource sharing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Live Speech-to-Text</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Captures educator speech with zero delay using native browser speech recognition, streaming timestamped captions directly to student devices.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Hand className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Sign Gesture Detection</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Empowers deaf students to communicate easily. Detects 8 key gestures including Question, Hand Raise, Understood, and Need Help with 21-point hand tracking.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Live Polls & Quizzes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Teachers launch live comprehension polls and timed interactive quizzes. Students submit answers in real time with instant class breakdown.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Classroom Quick Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Join a Live Classroom</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the 7-character code provided by your instructor (e.g. NXJS428).
            </p>
            <form onSubmit={handleQuickJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Classroom Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NXJS428"
                  value={quickJoinCode}
                  onChange={(e) => setQuickJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-mono font-bold tracking-widest text-center uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm transition"
                >
                  Enter Classroom
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400">
                Demo code: <span className="font-mono font-bold text-brand-600">NXJS428</span>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* SEVA - SignEase Virtual Agent Chatbot */}
      <SevaChatbot />

      <Footer />
    </div>
  )
}

