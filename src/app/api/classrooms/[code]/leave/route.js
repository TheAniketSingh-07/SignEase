import { NextResponse } from 'next/server'
import { removeStudentFromClassroom } from '@/lib/server/db'
import { broadcastToRoom, broadcastGlobal } from '@/lib/server/events'
import { authorize, getRouteCode, jsonError } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

/**
 * A student can remove themselves; the classroom's teacher can remove any student.
 */
export async function POST(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'member')
    if (ctx.error) return ctx.error

    const body = await req.json().catch(() => ({}))
    const isTeacher = ctx.user.role === 'teacher'
    const studentId = isTeacher ? body.studentId : ctx.user.id

    if (!studentId) return jsonError('studentId is required', 400)

    const classroom = removeStudentFromClassroom(code, studentId, { kicked: isTeacher })
    if (!classroom) return jsonError('Classroom not found', 404)

    broadcastToRoom(code, {
      type: 'STUDENT_REMOVED',
      studentId,
      kicked: isTeacher,
      students: classroom.students,
      student_count: classroom.students.length,
    })
    broadcastGlobal({ type: 'CLASSROOM_UPDATED', code })

    return NextResponse.json({ success: true, students: classroom.students })
  } catch (err) {
    return jsonError('Failed to leave classroom', 500)
  }
}
