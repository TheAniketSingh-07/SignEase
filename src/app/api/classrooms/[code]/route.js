import { NextResponse } from 'next/server'
import {
  getClassroomByCode,
  updateClassroom,
  deleteClassroom,
  isStudentMember,
} from '@/lib/server/db'
import { broadcastToRoom, broadcastGlobal } from '@/lib/server/events'
import {
  authorize,
  getRouteCode,
  getSessionUser,
  jsonError,
  toPublicClassroom,
} from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

/**
 * Anyone can check that a code is real (needed on the "Join" screen before signing in),
 * but only the owner / attendees receive the full classroom data.
 */
export async function GET(req, { params }) {
  const code = await getRouteCode(params)
  const classroom = getClassroomByCode(code)

  if (!classroom) {
    return jsonError('Classroom not found. Please check the code and try again.', 404)
  }

  const user = getSessionUser(req)
  const isOwner = user?.role === 'teacher' && classroom.teacher_id === user.id
  const isMember = user?.role === 'student' && isStudentMember(classroom, user.id)

  if (isOwner || isMember) {
    return NextResponse.json({
      classroom: { ...classroom, student_count: (classroom.students || []).length },
    })
  }

  return NextResponse.json({ classroom: toPublicClassroom(classroom) })
}

export async function PATCH(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'teacher')
    if (ctx.error) return ctx.error

    const body = await req.json()
    const wasActive = ctx.classroom.is_active
    const updated = updateClassroom(code, body)
    if (!updated) return jsonError('Classroom not found', 404)

    broadcastToRoom(code, { type: 'CLASSROOM_UPDATED', classroom: updated })
    broadcastGlobal({ type: 'CLASSROOM_UPDATED', code })

    // Tell everyone in the room when the lecture starts / ends
    if (wasActive !== updated.is_active) {
      broadcastToRoom(code, { type: 'CLASSROOM_STATUS', isActive: updated.is_active })
      broadcastGlobal({ type: 'CLASSROOM_STATUS', code })
    }

    return NextResponse.json({ success: true, classroom: updated })
  } catch (err) {
    console.error('Update classroom error:', err)
    return jsonError('Failed to update classroom', 500)
  }
}

export async function DELETE(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'teacher')
    if (ctx.error) return ctx.error

    const deleted = deleteClassroom(code)
    if (!deleted) return jsonError('Classroom not found', 404)

    broadcastToRoom(code, { type: 'CLASSROOM_DELETED', code })
    broadcastGlobal({ type: 'CLASSROOM_DELETED', code })

    return NextResponse.json({ success: true, code })
  } catch (err) {
    return jsonError('Failed to delete classroom', 500)
  }
}
