import { NextResponse } from 'next/server'
import {
  getUserFromToken,
  getClassroomByCode,
  isStudentMember,
  isStudentInRoom,
  normalizeCode,
} from '@/lib/server/db'

export const SESSION_COOKIE = 'signease_session'
export const GOOGLE_STATE_COOKIE = 'signease_google_oauth'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days (seconds)

export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function getTokenFromRequest(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7).trim()
  return req.cookies.get(SESSION_COOKIE)?.value || null
}

export function getSessionUser(req) {
  const token = getTokenFromRequest(req)
  return token ? getUserFromToken(token) : null
}

/** Public base URL of the app (needed for the Google OAuth redirect URI). */
export function getBaseUrl(req) {
  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/+$/, '')
  const proto = req.headers.get('x-forwarded-proto') || new URL(req.url).protocol.replace(':', '')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host
  return `${proto}://${host}`
}

export function isSecureRequest(req) {
  return getBaseUrl(req).startsWith('https://')
}

export function setSessionCookie(response, token, req) {
  response.cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true, // not readable from JavaScript -> safe against XSS token theft
    sameSite: 'lax',
    secure: isSecureRequest(req),
    maxAge: SESSION_MAX_AGE,
  })
}

/** Next.js 15+/16: route `params` is a Promise and MUST be awaited. */
export async function getRouteCode(params) {
  const resolved = await params
  return normalizeCode(resolved?.code)
}

/**
 * Check who is calling and whether they may touch this classroom.
 *
 * level:
 *   'viewer'  - owner teacher, or any signed-in student (used by realtime / join)
 *   'member'  - owner teacher, or a student who has attended this classroom
 *   'room'    - owner teacher, or a student currently inside the room
 *   'teacher' - only the teacher who owns the classroom
 *
 * Returns { user, classroom } on success or { error: NextResponse } on failure.
 */
export function authorize(req, code, level = 'member') {
  const user = getSessionUser(req)
  if (!user) return { error: jsonError('Please sign in to continue.', 401) }

  if (!code) return { error: jsonError('Invalid classroom code.', 400) }
  const classroom = getClassroomByCode(code)
  if (!classroom) {
    return { error: jsonError('Classroom not found. Please check the code and try again.', 404) }
  }

  const isOwner = user.role === 'teacher' && classroom.teacher_id === user.id

  if (level === 'teacher') {
    if (!isOwner) return { error: jsonError('Only the teacher of this classroom can do that.', 403) }
    return { user, classroom }
  }

  if (isOwner) return { user, classroom }

  if (user.role !== 'student') {
    return { error: jsonError('This classroom belongs to another teacher.', 403) }
  }

  if (level === 'viewer') return { user, classroom }

  if (level === 'room') {
    if (!isStudentInRoom(classroom, user.id)) {
      return { error: jsonError('You are not in this classroom. Please join it first.', 403) }
    }
    return { user, classroom }
  }

  // 'member'
  if (!isStudentMember(classroom, user.id)) {
    return { error: jsonError('You have not joined this classroom.', 403) }
  }
  return { user, classroom }
}

/** What anyone (even signed out) may see: enough to confirm a code is real. */
export function toPublicClassroom(classroom) {
  return {
    code: classroom.code,
    name: classroom.name,
    subject: classroom.subject,
    description: classroom.description,
    teacher_name: classroom.teacher_name,
    is_active: classroom.is_active,
    scheduled_date: classroom.scheduled_date,
    student_count: (classroom.students || []).length,
    public_view: true,
  }
}
