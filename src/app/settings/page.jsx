'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAccessibility } from '@/components/AccessibilityProvider'
import { hybridStore } from '@/lib/supabase/hybridStore'
import {
  Sliders,
  Type,
  Eye,
  Volume2,
  Hand,
  CheckCircle2,
  Database,
  Sparkles,
  Shield,
  User,
  Save,
} from 'lucide-react'

export default function SettingsPage() {
  const {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    dyslexicFont,
    setDyslexicFont,
    speechLanguage,
    setSpeechLanguage,
    gestureSensitivity,
    setGestureSensitivity,
    soundAlerts,
    setSoundAlerts,
    triggerVisualAlert,
    playNotificationSound,
  } = useAccessibility()

  const [user, setUser] = useState(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Supabase Diagnostics
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [connectedStatus, setConnectedStatus] = useState('Hybrid Local & Realtime Active')

  useEffect(() => {
    const current = hybridStore.getCurrentUser()
    if (current) {
      setUser(current)
      setFullName(current.full_name || '')
      setEmail(current.email || '')
    }
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) {
      setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
    }
  }, [])

  const handleSaveProfile = (e) => {
    e.preventDefault()
    hybridStore.updateProfile({
      full_name: fullName,
      email: email,
    })
    setSavedSuccess(true)
    playNotificationSound()
    triggerVisualAlert()
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar role={user?.role || 'teacher'} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings & Accessibility</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize font sizes, contrast, gesture sensitivity, and database connection
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved!
            </div>
          )}
        </header>

        <div className="p-8 max-w-4xl mx-auto space-y-8">
          {/* Section 1: User Profile */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Profile Information</h2>
                <p className="text-xs text-slate-500">Your display name and active role</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Visual Accessibility & Captions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Caption & Visual Accessibility</h2>
                <p className="text-xs text-slate-500">
                  Optimized for deaf, hard-of-hearing, and low-vision learners
                </p>
              </div>
            </div>

            {/* Font Size Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Caption Font Size
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'small', label: 'Small (16px)' },
                  { id: 'medium', label: 'Medium (18px)' },
                  { id: 'large', label: 'Large (24px)' },
                  { id: 'xlarge', label: 'Extra Large (30px)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFontSize(item.id)}
                    className={`py-3 px-3 rounded-xl border text-xs font-semibold transition text-center ${
                      fontSize === item.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* High Contrast Mode & Dyslexic Font */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">High Contrast Mode</h4>
                  <p className="text-[11px] text-slate-500">
                    High-contrast text and solid borders for maximum readability
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Dyslexia-Friendly Font</h4>
                  <p className="text-[11px] text-slate-500">
                    Enables high-legibility font weighting
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={dyslexicFont}
                  onChange={(e) => setDyslexicFont(e.target.checked)}
                  className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
              </div>
            </div>

            {/* Live Caption Preview Box */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Live Caption Preview:
              </span>
              <p
                className={`${
                  fontSize === 'small'
                    ? 'text-sm'
                    : fontSize === 'large'
                    ? 'text-2xl font-medium'
                    : fontSize === 'xlarge'
                    ? 'text-3xl font-semibold'
                    : 'text-lg'
                } text-white leading-relaxed`}
              >
                "Welcome to the lecture. Next.js App Router provides built-in accessibility and real-time streaming."
              </p>
            </div>
          </div>

          {/* Section 3: Speech & Hand Gesture Sensitivity */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Hand className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Speech & Gesture Recognition</h2>
                <p className="text-xs text-slate-500">
                  Tune Web Speech API language and MediaPipe sensitivity
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Speech Recognition Language
                </label>
                <select
                  value={speechLanguage}
                  onChange={(e) => setSpeechLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="fr-FR">French (France)</option>
                  <option value="de-DE">German (Germany)</option>
                  <option value="hi-IN">Hindi (India)</option>
                </select>
              </div>

              {/* Gesture Sensitivity */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Gesture Sensitivity Threshold
                  </label>
                  <span className="text-xs font-mono font-bold text-brand-600">
                    {Math.round(gestureSensitivity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={gestureSensitivity}
                  onChange={(e) => setGestureSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Higher threshold requires more precise hand positioning.
                </p>
              </div>
            </div>

            {/* Sound and Visual Notifications */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Notification Feedback</h4>
                <p className="text-[11px] text-slate-500">
                  Play tone and visual screen flash when a student sends a gesture
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playNotificationSound()
                    triggerVisualAlert()
                  }}
                  className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                >
                  Test Alert
                </button>
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => setSoundAlerts(e.target.checked)}
                  className="w-5 h-5 rounded text-brand-600 border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Supabase Integration & Diagnostics */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Supabase & Cloud Sync</h2>
                <p className="text-xs text-slate-500">
                  Database architecture, Realtime channels, and storage
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Storage Engine:</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                  {connectedStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Realtime Protocol:</span>
                <span className="text-slate-600">
                  BroadcastChannel & WebSocket multi-tab synchronization
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Schema File:</span>
                <span className="font-mono text-slate-600">supabase/schema.sql (RLS Protected)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
