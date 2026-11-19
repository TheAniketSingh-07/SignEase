import { NextResponse } from 'next/server'
import {
  getClassroomsForTeacher,
  getClassroomsForStudent,
  createClassroom,
} from '@/lib/server/db'
import { broadcastGlobal } from '@/lib/server/events'
import { getSessionUser, jsonError } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

/** List the signed-in user's own classrooms (teacher: created by them, student: joined by them). */
export async function GET(req) {
  try {
    const user = getSessionUser(req)
    if (!user) return jsonError('Please sign in to continue.', 401)

    const classrooms =
      user.role === 'teacher' ? getClassroomsForTeacher(user.id) : getClassroomsForStudent(user.id)

    const mapped = classrooms.map((c) => ({
      ...c,
      student_count: (c.students || []).length,
    }))

    return NextResponse.json({ classrooms: mapped })
  } catch (err) {
    console.error('List classrooms error:', err)
    return jsonError('Failed to fetch classrooms', 500)
  }
}

/** Create a classroom. Only a signed-in teacher can do this; the owner is taken from the session. */
export async function POST(req) {
  try {
    const user = getSessionUser(req)
    if (!user) return jsonError('Please sign in to create a classroom.', 401)
    if (user.role !== 'teacher') return jsonError('Only teachers can create classrooms.', 403)

    const { name, subject, description, scheduledDate } = await req.json()

    if (!name?.trim() || !subject?.trim()) {
      return jsonError('Class Name and Subject are required.', 400)
    }

    const classroom = createClassroom({
      name: name.trim().slice(0, 120),
      subject: subject.trim().slice(0, 120),
      description: (description || '').slice(0, 1000),
      teacherId: user.id,
      teacherName: user.name,
      scheduledDate,
    })

    broadcastGlobal({ type: 'CLASSROOM_CREATED', code: classroom.code })

    return NextResponse.json({ classroom }, { status: 201 })
  } catch (err) {
    console.error('Create classroom error:', err)
    return jsonError('Server error creating classroom', 500)
  }
}
