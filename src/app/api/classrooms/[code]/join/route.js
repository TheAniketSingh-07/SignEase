import { NextResponse } from 'next/server'
import { addStudentToClassroom } from '@/lib/server/db'
import { broadcastToRoom, broadcastGlobal } from '@/lib/server/events'
import { authorize, getRouteCode, jsonError } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

/**
 * Join a classroom with its code. The student is identified by their signed-in session,
 * never by data sent from the browser.
 */
export async function POST(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'viewer')
    if (ctx.error) return ctx.error

    if (ctx.user.role !== 'student') {
      return jsonError('Only students can join a classroom with a code. Teachers manage their own classrooms.', 403)
    }

    const classroom = addStudentToClassroom(code, ctx.user)
    if (!classroom) return jsonError('Classroom not found', 404)

    const student = classroom.students.find((s) => s.id === ctx.user.id)

    broadcastToRoom(code, {
      type: 'STUDENT_JOINED',
      student,
      students: classroom.students,
      student_count: classroom.students.length,
    })
    broadcastGlobal({ type: 'CLASSROOM_UPDATED', code })

    return NextResponse.json({
      success: true,
      classroom: { ...classroom, student_count: classroom.students.length },
    })
  } catch (err) {
    console.error('Join classroom error:', err)
    return jsonError('Failed to join classroom', 500)
  }
}
