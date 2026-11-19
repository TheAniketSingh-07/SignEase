'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import { hybridStore } from '@/lib/supabase/hybridStore'
import { Loader2 } from 'lucide-react'

/** Only allow navigating to paths inside this app. */
function safeNext(path, fallback) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return fallback
  return path
}

/**
 * Landing page after Google sign-in. The server has already verified the Google account
 * and set the session cookie; here we just load the verified user into the browser store
 * and continue to the dashboard / classroom.
 */
function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const [statusText, setStatusText] = useState('Signing you in with Google...')

  useEffect(() => {
    let cancelled = false
    const finish = async () => {
      const user = await hybridStore.syncSession()
      if (cancelled) return
      if (!user) {
        router.replace('/login?error=' + encodeURIComponent('Google sign-in could not be completed. Please try again.'))
        return
      }
      setStatusText(`Welcome, ${user.name || 'there'}!`)
      const fallback = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
      router.replace(safeNext(next, fallback))
    }
    finish()
    return () => {
      cancelled = true
    }
  }, [router, next])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <Logo />
      <div className="mt-8 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-700">{statusText}</p>
        <p className="text-xs text-slate-400">Setting up your secure classroom session...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  )
}
