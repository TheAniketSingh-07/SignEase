import { NextResponse } from 'next/server'
import { createQuiz, launchQuiz, submitQuizAnswer, closeQuiz } from '@/lib/server/db'
import { broadcastToRoom } from '@/lib/server/events'
import { authorize, getRouteCode, jsonError } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const code = await getRouteCode(params)
  const ctx = authorize(req, code, 'member')
  if (ctx.error) return ctx.error
  return NextResponse.json({ quizzes: ctx.classroom.quizzes || [] })
}

// Teacher creates / launches a quiz
export async function POST(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'teacher')
    if (ctx.error) return ctx.error

    const body = await req.json()
    const { action, quizId, ...quizData } = body

    if (action === 'launch') {
      const quiz = launchQuiz(code, quizId)
      if (!quiz) return jsonError('Quiz not found', 404)
      broadcastToRoom(code, { type: 'START_QUIZ', quiz })
      return NextResponse.json({ success: true, quiz })
    }

    if (!quizData.question?.trim() || !Array.isArray(quizData.options) || quizData.options.length < 2) {
      return jsonError('A quiz needs a question and at least two options.', 400)
    }

    const quiz = createQuiz(code, quizData)
    if (!quiz) return jsonError('Failed to create quiz', 400)

    broadcastToRoom(code, { type: 'START_QUIZ', quiz })
    return NextResponse.json({ success: true, quiz })
  } catch (err) {
    return jsonError('Failed to process quiz request', 500)
  }
}

// Student submits an answer (graded on the server)
export async function PUT(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'room')
    if (ctx.error) return ctx.error

    const { quizId, selected_option } = await req.json()

    const quiz = submitQuizAnswer(code, quizId, {
      student_id: ctx.user.id,
      student_name: ctx.user.name,
      selected_option,
    })

    if (!quiz) return jsonError('This quiz is closed or the answer is invalid.', 400)

    broadcastToRoom(code, { type: 'QUIZ_ANSWERED', quiz })
    return NextResponse.json({ success: true, quiz })
  } catch (err) {
    return jsonError('Failed to submit answer', 500)
  }
}

// Teacher closes a quiz
export async function PATCH(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'teacher')
    if (ctx.error) return ctx.error

    const { quizId } = await req.json()

    closeQuiz(code, quizId)
    broadcastToRoom(code, { type: 'QUIZ_CLOSED', quizId })
    return NextResponse.json({ success: true })
  } catch (err) {
    return jsonError('Failed to close quiz', 500)
  }
}
