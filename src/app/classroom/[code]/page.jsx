'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { hybridStore } from '@/lib/supabase/hybridStore'
import ClassroomNotFound from '@/components/ClassroomNotFound'

export default function ClassroomRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const rawCode = params.code || ''
  const code = rawCode.toString().toUpperCase().trim()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // 1. Reserved words safety interception
    const lower = code.toLowerCase()
    if (lower === 'login') {
      router.replace('/login')
      return
    }
    if (lower === 'register' || lower === 'signup') {
      router.replace('/register')
      return
    }
    if (lower === 'create') {
      router.replace('/teacher/classrooms/create')
      return
    }

    if (!code) {
      setNotFound(true)
      setLoading(false)
      return
    }

    // 2. Verify genuine classroom existence
    const verifyClassroom = async () => {
      try {
        const c = await hybridStore.getClassroomByCode(code)
        if (!c) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const user = hybridStore.getCurrentUser()
        if (!user) {
          router.replace(`/login?code=${code}&redirect=${encodeURIComponent(`/classroom/${code}/student`)}`)
          return
        }

        if (user.role === 'teacher') {
          router.replace(`/classroom/${code}/teacher`)
        } else {
          router.replace(`/classroom/${code}/student`)
        }
      } catch (err) {
        setNotFound(true)
        setLoading(false)
      }
    }

    verifyClassroom()
  }, [code, router])

  if (notFound) {
    return <ClassroomNotFound code={code} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        <p className="text-xs text-slate-500 font-medium">Entering classroom {code}...</p>
      </div>
    </div>
  )
}
