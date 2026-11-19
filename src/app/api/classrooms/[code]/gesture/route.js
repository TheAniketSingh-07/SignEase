import { NextResponse } from 'next/server'
import { addGestureEvent } from '@/lib/server/db'
import { broadcastToRoom } from '@/lib/server/events'
import { authorize, getRouteCode, jsonError } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function POST(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'room')
    if (ctx.error) return ctx.error

    const gestureData = await req.json()
    if (!gestureData?.gesture_name) return jsonError('Gesture details are required.', 400)

    const event = addGestureEvent(code, {
      ...gestureData,
      // identity always comes from the session
      student_id: ctx.user.id,
      student_name: ctx.user.name,
    })
    if (!event) return jsonError('Classroom not found', 404)

    broadcastToRoom(code, { type: 'NEW_GESTURE_EVENT', event })
    return NextResponse.json({ success: true, event })
  } catch (err) {
    return jsonError('Failed to record gesture', 500)
  }
}
