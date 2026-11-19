import { NextResponse } from 'next/server'
import { addTranscriptItem, clearTranscripts } from '@/lib/server/db'
import { broadcastToRoom } from '@/lib/server/events'
import { authorize, getRouteCode, jsonError } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const code = await getRouteCode(params)
  const ctx = authorize(req, code, 'member')
  if (ctx.error) return ctx.error
  return NextResponse.json({ transcripts: ctx.classroom.transcripts || [] })
}

// Only the teacher produces captions
export async function POST(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'teacher')
    if (ctx.error) return ctx.error

    const { speaker, text, timestamp, isInterim } = await req.json()

    // An empty interim message is used to clear the live caption line
    if (isInterim) {
      broadcastToRoom(code, {
        type: 'INTERIM_TRANSCRIPT',
        speaker: speaker || ctx.user.name,
        text: (text || '').trim(),
      })
      return NextResponse.json({ success: true, isInterim: true })
    }

    if (!text || !text.trim()) return jsonError('Text cannot be empty', 400)

    const item = addTranscriptItem(code, { speaker: speaker || ctx.user.name, text, timestamp })
    if (!item) return jsonError('Classroom not found', 404)

    broadcastToRoom(code, { type: 'NEW_TRANSCRIPT', item })
    return NextResponse.json({ success: true, item })
  } catch (err) {
    return jsonError('Failed to add transcript', 500)
  }
}

export async function DELETE(req, { params }) {
  const code = await getRouteCode(params)
  const ctx = authorize(req, code, 'teacher')
  if (ctx.error) return ctx.error

  clearTranscripts(code)
  broadcastToRoom(code, { type: 'TRANSCRIPTS_CLEARED' })
  return NextResponse.json({ success: true })
}
