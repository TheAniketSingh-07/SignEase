import { NextResponse } from 'next/server'
import { addStudentQuestion } from '@/lib/server/db'
import { broadcastToRoom } from '@/lib/server/events'
import { authorize, getRouteCode, jsonError } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function POST(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'room')
    if (ctx.error) return ctx.error

    const { text } = await req.json()
    if (!text || !text.trim()) return jsonError('Question text cannot be empty', 400)

    const question = addStudentQuestion(code, {
      student_id: ctx.user.id,
      student_name: ctx.user.name,
      text: text.slice(0, 1000),
    })
    if (!question) return jsonError('Classroom not found', 404)

    broadcastToRoom(code, { type: 'STUDENT_QUESTION', question })
    return NextResponse.json({ success: true, question })
  } catch (err) {
    return jsonError('Failed to submit question', 500)
  }
}
