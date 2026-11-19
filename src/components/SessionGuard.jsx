'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { hybridStore } from '@/lib/supabase/hybridStore'

/**
 * Keeps the browser's login state honest.
 * On every page change it asks the server who is really signed in. If the browser
 * thinks someone is logged in but the server disagrees (session expired, server data
 * reset, cookie cleared) the stale login is wiped and - on protected pages - the user
 * is sent to the login screen instead of seeing confusing "invalid" errors.
 */
export default function SessionGuard() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    const hadLocalUser = Boolean(hybridStore.getCurrentUser())

    hybridStore.syncSession().then((user) => {
      if (cancelled || user || !hadLocalUser) return
      const isProtected =
        pathname.startsWith('/teacher') || pathname.startsWith('/student') || pathname.startsWith('/settings')
      if (isProtected) {
        const role = pathname.startsWith('/student') ? 'student' : 'teacher'
        router.replace(`/login?role=${role}&redirect=${encodeURIComponent(pathname)}`)
      }
    })

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  return null
}
