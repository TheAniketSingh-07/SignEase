'use client'

import React from 'react'
import Link from 'next/link'
import Logo from './ui/Logo'
import { Heart, Globe, Shield, Sparkles } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <Logo />
            <p className="text-sm text-slate-500 leading-relaxed">
              Empowering deaf and hard-of-hearing students with real-time speech captions and AI sign language detection.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-600 font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Built for WCAG 2.1 AA Compliance</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/teacher/dashboard" className="hover:text-brand-600 transition">
                  Teacher Dashboard
                </Link>
              </li>
              <li>
                <Link href="/student/dashboard" className="hover:text-brand-600 transition">
                  Student Classroom
                </Link>
              </li>
              <li>
                <Link href="/teacher/classrooms/create" className="hover:text-brand-600 transition">
                  Create Classroom
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-brand-600 transition">
                  Accessibility Controls
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Accessibility
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>Web Speech API Captions</li>
              <li>MediaPipe Hand Tracking</li>
              <li>Real-time Multi-tab Sync</li>
              <li>AI Lecture Summarization</li>
              <li>High-Contrast & Dyslexia Fonts</li>
            </ul>
          </div>

          {/* Mission */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Our Mission
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every student deserves equal access to knowledge. SignEase bridges communication gaps in lecture halls and remote classes worldwide.
            </p>
            <div className="mt-4 p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-center gap-2 text-xs text-brand-800">
              <Heart className="w-4 h-4 text-brand-500 shrink-0" />
              <span>Free for educators and schools worldwide.</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} SignEase Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/settings" className="hover:text-slate-600">
              Accessibility Statement
            </Link>
            <Link href="/" className="hover:text-slate-600">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-slate-600">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
