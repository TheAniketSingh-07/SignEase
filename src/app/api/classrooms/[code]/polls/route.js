import { NextResponse } from 'next/server'
import { createPoll, votePoll, closePoll } from '@/lib/server/db'
import { broadcastToRoom } from '@/lib/server/events'
import { authorize, getRouteCode, jsonError } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const code = await getRouteCode(params)
  const ctx = authorize(req, code, 'member')
  if (ctx.error) return ctx.error
  return NextResponse.json({ polls: ctx.classroom.polls || [] })
}

// Teacher launches a poll
export async function POST(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'teacher')
    if (ctx.error) return ctx.error

    const { question, options } = await req.json()
    if (!question?.trim() || !Array.isArray(options) || options.length < 2) {
      return jsonError('A poll needs a question and at least two options.', 400)
    }

    const poll = createPoll(code, { question, options })
    if (!poll) return jsonError('Classroom not found', 404)

    broadcastToRoom(code, { type: 'NEW_POLL', poll })
    return NextResponse.json({ success: true, poll })
  } catch (err) {
    return jsonError('Failed to create poll', 500)
  }
}

// Student votes
export async function PUT(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'room')
    if (ctx.error) return ctx.error

    const { pollId, optionId } = await req.json()

    const poll = votePoll(code, pollId, optionId, ctx.user.id)
    if (!poll) return jsonError('This poll is closed or no longer available.', 400)

    broadcastToRoom(code, { type: 'POLL_VOTED', poll })
    return NextResponse.json({ success: true, poll })
  } catch (err) {
    return jsonError('Failed to cast vote', 500)
  }
}

// Teacher closes a poll
export async function PATCH(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'teacher')
    if (ctx.error) return ctx.error

    const { pollId } = await req.json()
    const poll = closePoll(code, pollId)
    broadcastToRoom(code, { type: 'POLL_CLOSED', poll })
    return NextResponse.json({ success: true, poll })
  } catch (err) {
    return jsonError('Failed to close poll', 500)
  }
}
